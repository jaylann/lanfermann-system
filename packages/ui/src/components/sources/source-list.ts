/**
 * The sources of an answer, without React: where a numbered reference points, and the site a
 * source is shown under. Plain functions, so they can be tested.
 */

/** One source of an answer. */
export type Source = {
  /** What it is called: the page's title, a document's name. */
  title: string;
  /** Where it is. */
  url: string;
  /** The site or the place it is from, where the address says it badly („Angebote“, „Mail“). */
  site?: string;
  /** A line or two of what it says, the part the answer used. */
  excerpt?: string;
};

/** The site a source is shown under: its own `site`, else the address's host without `www.`. */
export function siteOf(source: Pick<Source, "url" | "site">): string {
  if (source.site) return source.site;
  try {
    return new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return source.url;
  }
}

/**
 * The source a reference's number stands for. A number without its source is an error, since
 * the reference would lead nowhere: it is said loudly in the console, and the number stands
 * without a link. It does not throw: a model may well name a source it never gave, and the
 * answer must still be readable.
 */
export function sourceAt(sources: readonly Source[], n: number): Source | undefined {
  const source = Number.isInteger(n) ? sources[n - 1] : undefined;
  if (!source) {
    console.error(
      `SourceReference ${n} has no source: give Sources ${n} items or more, so the number leads somewhere.`,
    );
  }
  return source;
}

/** The id of a source's entry in the list, which its references link to. */
export function entryId(base: string, n: number): string {
  return `${base}-quelle-${n}`;
}
