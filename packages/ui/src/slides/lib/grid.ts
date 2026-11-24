/**
 * The slide grid in px: twelve columns of 80 with 64 gutters, inside 128 margins (slides.css has
 * the same numbers as `--slide-column` and `--slide-gutter`; `slide-span-<n>` is the utility for a
 * fixed span). Parts use these where a width depends on a prop.
 */
export const SLIDE_COLUMN = 80;
export const SLIDE_GUTTER = 64;

/** The width of `columns` grid columns with the gutters between them: `span(6)` is 800. */
export function span(columns: number): number {
  return columns * SLIDE_COLUMN + (columns - 1) * SLIDE_GUTTER;
}

/** A grid template of fixed column spans: `spans([7, 5])` is "944px 656px". */
export function spans(columns: readonly number[]): string {
  return columns.map((count) => `${span(count)}px`).join(" ");
}
