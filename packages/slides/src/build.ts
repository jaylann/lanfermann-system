import { analyzeDeck, type AnalyzeInput, type DeckAnalysis } from "./analyze";
import { bundleDeck } from "./bundle";
import { type CspExtras, deckCsp, deckHtml, type DeckMode } from "./html";
import { assetKey, dataUrl } from "./source";
import type { DeckError } from "./types";

/** The data URLs of the deck's pictures that its script names, for `deckHtml`'s `assets`. */
export function assetsFor(
  js: string,
  images: Readonly<Record<string, Uint8Array>> = {},
): Record<string, string> {
  const assets: Record<string, string> = {};
  for (const [path, bytes] of Object.entries(images)) {
    const name = assetKey(path);
    if (js.includes(name)) assets[name] = dataUrl(path, bytes);
  }
  return assets;
}

/**
 * One file for a deck's script, as the command line makes it: the deck's pictures inline, its
 * title and language from the source, and the strict policy that fits exactly this file.
 */
export async function htmlFor(
  js: string,
  source: AnalyzeInput,
  analysis: Pick<DeckAnalysis, "title" | "lang">,
  options: { mode: DeckMode; pdfUrl?: string },
  extras?: CspExtras,
): Promise<string> {
  const parts = { ...options, assets: assetsFor(js, source.images) };
  return deckHtml(js, {
    ...parts,
    title: analysis.title ?? "Slides",
    lang: analysis.lang ?? "de",
    csp: deckCsp(js, parts, extras),
  });
}

export type BuildOptions = {
  /** Whom the file is for. An audience's file holds no notes; a presenter's shows them. */
  mode: "audience" | "presenter";
  /** The name of the deck's PDF beside the file. With it the audience's view links it. */
  pdfName?: string;
};

export type BuildResult = {
  ok: boolean;
  /** The one HTML file. There only when `ok` is true. */
  html?: string;
  /** The version of `@lanfermann/ui` whose player is inside. */
  kitVersion: string;
  errors: DeckError[];
};

/**
 * A deck from its source to one HTML file: `bundleDeck` (with the notes left out for an
 * audience), the deck's pictures as data URLs, then `deckHtml` under `deckCsp`. It does not
 * check types or layout; `checkDeck` does, and the command line runs it first.
 */
export async function buildDeck(source: AnalyzeInput, options: BuildOptions): Promise<BuildResult> {
  const { files, entry } = source;
  const bundle = await bundleDeck({ files, entry, stripNotes: options.mode === "audience" });
  const { kitVersion, errors } = bundle;
  if (!bundle.ok || bundle.js === undefined) return { ok: false, kitVersion, errors };
  const html = await htmlFor(bundle.js, source, analyzeDeck(source), {
    mode: options.mode,
    ...(options.pdfName === undefined ? {} : { pdfUrl: options.pdfName }),
  });
  return { ok: true, html, kitVersion, errors };
}
