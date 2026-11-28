import { createHash } from "node:crypto";

import { type Kit, loadKit } from "./kit";
import { version } from "./version";

/** How a built file shows its deck. */
export type DeckMode = "audience" | "presenter" | "print" | "check";

export type DeckHtmlOptions = {
  /**
   * The mode the file opens in, and with it what `?mode=` in its address may pick: an
   * audience's file also prints and checks; a presenter's also shows the audience's view; a
   * file made to print or to check does nothing else.
   */
  mode: DeckMode;
  /** The page's title, as plain text. */
  title: string;
  /** The deck's language, as a BCP 47 tag. */
  lang: string;
  /** The address of the deck as a PDF. With it the audience's controls offer „PDF laden“. */
  pdfUrl?: string;
  /**
   * The page's Content Security Policy. Written as a `<meta>` when given, and not otherwise:
   * the policy is the caller's. `deckCsp` makes a strict one for exactly this file.
   */
  csp?: string;
  /**
   * The pictures of the deck: the text a picture is named by in the script (an address, or
   * `./bilder/werkbank.png` for a file of the deck) to where the page finds it. Each name that
   * stands in the script as a string is replaced by its value. A value is one of three kinds:
   *
   * - a data URL (`data:image/png;base64,…`): the picture is in the file, which loads nothing;
   * - an absolute `https:` address (`https://cdn.example.com/a.png`), without a user name;
   * - a path on the page's own origin: `/decks/a.png`, `./a.png` or `../a.png`.
   *
   * Anything else (`http:`, another scheme, `//host/a.png`, a bare word, a value with a blank
   * or a backslash in it) is a `TypeError`. A file with addresses or paths is for a server that
   * publishes the pictures beside it, and `deckCsp` allows exactly their origins; the layout
   * check and the PDF open a file without a network, so they take data URLs.
   */
  assets?: Readonly<Record<string, string>>;
};

/** What `?mode=` may pick in a file, by the mode it was built for. */
const MODES: Readonly<Record<DeckMode, readonly DeckMode[]>> = {
  audience: ["audience", "print", "check"],
  presenter: ["presenter", "audience", "print", "check"],
  print: ["print"],
  check: ["check"],
};

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("base64");

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * A script as it may stand between `<script>` and `</script>`: nothing in it ends the element
 * or opens a comment. Both replacements mean the same inside a string, which is where a
 * minified script holds such text.
 */
function inlineScript(code: string): string {
  return code
    .replaceAll("\r\n", "\n")
    .replace(/<\/(script)/gi, "<\\/$1")
    .replaceAll("<!--", "<\\!--");
}

function inlineStyle(css: string): string {
  return css.replaceAll("\r\n", "\n").replace(/<\/(style)/gi, "<\\/$1");
}

/** Text inside an HTML comment: nothing in it may end the comment or open another. */
function commentText(text: string): string {
  return text.replaceAll("<!--", "<! --").replaceAll("-->", "-- >").replaceAll("--!>", "--! >");
}

/** Where a page gets a picture from: out of itself, from its own origin, or from another. */
type AssetPlace = { from: "data" } | { from: "self" } | { from: "origin"; origin: string };

/**
 * A blank, a control character or a backslash: a browser drops or rewrites them in an address,
 * so `/\host` and a `/` followed by a tab and `/host` would both name another server.
 */
const isUnsafeInAddress = (value: string) =>
  [...value].some((char) => char <= " " || char === "\u007f" || char === "\\");
/** A host as a policy can name it (`host-source` of CSP): letters, digits, hyphens and dots. */
const POLICY_HOST = /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.?$/;

/**
 * Which of the three kinds of value an asset is, or `undefined` for one `deckHtml` refuses.
 * The origin of an address is the one a browser would ask, as the URL parser reads it.
 */
function assetPlace(value: string): AssetPlace | undefined {
  if (value.startsWith("data:")) return { from: "data" };
  if (isUnsafeInAddress(value)) return undefined;
  // A path of the page's own origin. `//host` names another one, so it is not among them.
  if (/^(?:\/(?!\/)|\.\.?\/)/.test(value)) return { from: "self" };
  if (!/^https:\/\//i.test(value) || !URL.canParse(value)) return undefined;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "") return undefined;
  // A host with `*`, `;` or `,` in it would say something else in a policy than it names.
  return POLICY_HOST.test(url.hostname) ? { from: "origin", origin: url.origin } : undefined;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The deck's script with each picture's name replaced by its value, and what `img-src` has to
 * allow besides `data:` for those values to load: `'self'` first, then the origins by name.
 */
function withAssets(
  js: string,
  assets: Readonly<Record<string, string>>,
): { code: string; sources: string[] } {
  let self = false;
  const origins = new Set<string>();
  const replacements = new Map<string, string>();
  for (const [name, url] of Object.entries(assets)) {
    const place = assetPlace(url);
    if (place === undefined) {
      // The name only: the value may be long, or hold what belongs in no log.
      throw new TypeError(
        `The asset ${JSON.stringify(name)} is neither a data URL, an https address nor a path ` +
          "on the page's own origin (/…, ./… or ../…).",
      );
    }
    if (place.from === "self") self = true;
    else if (place.from === "origin") origins.add(place.origin);
    // As a string of its own, in each way a bundler may quote it: never as a part of a longer
    // text, which could be another picture's name.
    for (const quoted of [JSON.stringify(name), `'${name}'`, `\`${name}\``]) {
      replacements.set(quoted, JSON.stringify(url));
    }
  }
  const sources = [...(self ? ["'self'"] : []), ...[...origins].sort()];
  if (replacements.size === 0) return { code: js, sources };
  // In one pass over the script as the bundler wrote it: a value that reads like another
  // picture's name (`./a.png` is both a name and a path) is not replaced a second time.
  const names = [...replacements.keys()].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(names.map(escapeRegExp).join("|"), "g");
  return { code: js.replace(pattern, (found) => replacements.get(found) ?? found), sources };
}

type Parts = {
  kit: Kit;
  style: string;
  scripts: string[];
  /** What `img-src` allows besides `data:`: nothing for a deck whose pictures are all inline. */
  imageSources: string[];
};

/** The inline parts of a file, exactly as they stand in it: what a policy's hashes are of. */
function partsOf(
  js: string,
  { mode, pdfUrl, assets }: Pick<DeckHtmlOptions, "mode" | "pdfUrl" | "assets">,
): Parts {
  const kit = loadKit();
  const options = { mode, modes: MODES[mode], ...(pdfUrl === undefined ? {} : { pdf: pdfUrl }) };
  const mount = `__LF_SLIDES__.mount(__LF_DECK__.default,${JSON.stringify(options).replaceAll("<", "\\u003c")});`;
  const deck = assets ? withAssets(js, assets) : { code: js, sources: [] };
  return {
    kit,
    style: inlineStyle(`${kit.fonts}\n${kit.css}`),
    scripts: [inlineScript(kit.script), inlineScript(deck.code), inlineScript(mount)],
    imageSources: deck.sources,
  };
}

export type CspExtras = {
  /** Further inline scripts the page will carry, exactly as they stand in it. */
  scripts?: readonly string[];
  /** Allow connections to the page's own origin (a preview server's reload line). */
  connectSelf?: boolean;
};

/**
 * A strict policy for the file `deckHtml` makes from the same script and options: the inline
 * style and scripts are allowed by the hash of their exact text, fonts only as data, and
 * pictures as data and from where `assets` says they are. With data URLs alone that is
 * `img-src data:`, and the file loads nothing from anywhere. A path on the page's own origin
 * adds `'self'`, an `https:` address its origin (each once, in order of name), and nothing
 * wider: no scheme, no wildcard. Pass it back as `csp`.
 *
 * Throws the `TypeError` `deckHtml` rejects with, for an asset that is none of the three kinds.
 */
export function deckCsp(
  js: string,
  options: Pick<DeckHtmlOptions, "mode" | "pdfUrl" | "assets">,
  extras: CspExtras = {},
): string {
  const { style, scripts, imageSources } = partsOf(js, options);
  const hashes = [...scripts, ...(extras.scripts ?? [])].map((code) => `'sha256-${sha256(code)}'`);
  return [
    "default-src 'none'",
    `style-src 'sha256-${sha256(style)}'`,
    `script-src ${hashes.join(" ")}`,
    ["img-src data:", ...imageSources].join(" "),
    "font-src data:",
    ...(extras.connectSelf ? ["connect-src 'self'"] : []),
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

/**
 * Makes a deck one self-contained HTML file: the prebuilt player's script, styles and fonts
 * inline, the deck's script (`bundleDeck`'s `js`), and the line that mounts it. The file runs
 * from a disk, without a network.
 *
 * The first line names the versions it was made with; the notices of what the player contains
 * from others stand at the end, as the licences of the fonts ask.
 */
export function deckHtml(js: string, options: DeckHtmlOptions): Promise<string> {
  return new Promise((done) => {
    const { kit, style, scripts } = partsOf(js, options);
    const policy =
      options.csp === undefined
        ? []
        : [`<meta http-equiv="Content-Security-Policy" content="${escapeHtml(options.csp)}">`];
    done(
      [
        "<!doctype html>",
        `<!-- A deck built with @lanfermann/slides ${version} on the player of @lanfermann/ui ` +
          `${kit.version}. The notices of what the player contains stand at the end of this file. -->`,
        `<html lang="${escapeHtml(options.lang)}">`,
        "<head>",
        '<meta charset="utf-8">',
        ...policy,
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        // No picture for the tab: without this line a browser asks the server for one.
        '<link rel="icon" href="data:,">',
        `<title>${escapeHtml(options.title)}</title>`,
        `<style>${style}</style>`,
        "</head>",
        "<body>",
        ...scripts.map((code) => `<script>${code}</script>`),
        "</body>",
        "</html>",
        `<!--\n${commentText(kit.notices.trimEnd())}\n-->`,
        "",
      ].join("\n"),
    );
  });
}
