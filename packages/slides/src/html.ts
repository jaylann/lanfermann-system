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
   * `./bilder/werkbank.png` for a file of the deck) to its data URL. Each name that stands in
   * the script as a string is replaced, so the file loads nothing.
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

/** The deck's script with each picture's name replaced by its data URL. */
function withAssets(js: string, assets: Readonly<Record<string, string>>): string {
  let code = js;
  for (const [name, url] of Object.entries(assets)) {
    if (!url.startsWith("data:")) {
      throw new TypeError(`The asset ${JSON.stringify(name)} is not a data URL.`);
    }
    const replacement = JSON.stringify(url);
    // As a string of its own, in each way a bundler may quote it: never as a part of a longer
    // text, which could be another picture's name.
    for (const quoted of [JSON.stringify(name), `'${name}'`, `\`${name}\``]) {
      code = code.split(quoted).join(replacement);
    }
  }
  return code;
}

type Parts = { kit: Kit; style: string; scripts: string[] };

/** The inline parts of a file, exactly as they stand in it: what a policy's hashes are of. */
function partsOf(
  js: string,
  { mode, pdfUrl, assets }: Pick<DeckHtmlOptions, "mode" | "pdfUrl" | "assets">,
): Parts {
  const kit = loadKit();
  const options = { mode, modes: MODES[mode], ...(pdfUrl === undefined ? {} : { pdf: pdfUrl }) };
  const mount = `__LF_SLIDES__.mount(__LF_DECK__.default,${JSON.stringify(options).replaceAll("<", "\\u003c")});`;
  return {
    kit,
    style: inlineStyle(`${kit.fonts}\n${kit.css}`),
    scripts: [
      inlineScript(kit.script),
      inlineScript(assets ? withAssets(js, assets) : js),
      inlineScript(mount),
    ],
  };
}

export type CspExtras = {
  /** Further inline scripts the page will carry, exactly as they stand in it. */
  scripts?: readonly string[];
  /** Allow connections to the page's own origin (a preview server's reload line). */
  connectSelf?: boolean;
};

/**
 * A strict policy for the file `deckHtml` makes from the same script and options: nothing is
 * loaded from anywhere, the inline style and scripts are allowed by the hash of their exact
 * text, pictures and fonts only as data. Pass it back as `csp`.
 */
export function deckCsp(
  js: string,
  options: Pick<DeckHtmlOptions, "mode" | "pdfUrl" | "assets">,
  extras: CspExtras = {},
): string {
  const { style, scripts } = partsOf(js, options);
  const hashes = [...scripts, ...(extras.scripts ?? [])].map((code) => `'sha256-${sha256(code)}'`);
  return [
    "default-src 'none'",
    `style-src 'sha256-${sha256(style)}'`,
    `script-src ${hashes.join(" ")}`,
    "img-src data:",
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
