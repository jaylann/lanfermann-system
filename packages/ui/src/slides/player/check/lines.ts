/**
 * How many lines a text runs to, from the tops of the boxes its pieces are drawn in
 * (`Range.getClientRects()`): pieces of one line share a top, give or take `tolerance` px for a
 * piece in another size or weight. Pure, so it can be tested without a browser.
 */
export function countLines(tops: readonly number[], tolerance: number): number {
  const sorted = tops.filter((top) => Number.isFinite(top)).sort((a, b) => a - b);
  let lines = 0;
  let line = Number.NEGATIVE_INFINITY;
  for (const top of sorted) {
    // Measured from where the line began, so a slow drift down a long line cannot join two.
    if (top - line > tolerance) {
      lines += 1;
      line = top;
    }
  }
  return lines;
}

/** The first `length` characters of a text on one line, for a report. */
export function excerpt(text: string, length = 80): string {
  return text.replace(/\s+/g, " ").trim().slice(0, length);
}
