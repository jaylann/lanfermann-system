/**
 * The colour a series wears: one of the six series colours (`chart.css`), or `muted`, the
 * de-emphasis grey for a part that is context (a remainder, „Sonstige“).
 *
 * A chart colours its series by their place: the first takes 1, the second 2. That is right for
 * series without an identity of their own. Where a series has one (a service with a brand
 * colour, a state that is always green), it names its colour and then wears it wherever it
 * stands, in every chart of the page, so bar, part, trend and legend agree.
 *
 * Name the colour of every series of a chart, or of none. A series that names none keeps the
 * colour of its place, which another one may have named: the two then share it.
 */
export type SeriesColor = 1 | 2 | 3 | 4 | 5 | 6 | "muted";

/** A series colour as CSS values: its fill, and the text that reads on that fill. */
export type SeriesPaint = { fill: string; on: string };

const byPlace: readonly SeriesColor[] = [1, 2, 3, 4, 5, 6];

/**
 * The colour of the series at `place` (from 0) when it names none: the six in their fixed
 * order, never cycling; every series past the sixth wears the sixth (more is a table).
 */
export function seriesColorAt(place: number): SeriesColor {
  const index = Number.isFinite(place) ? Math.min(Math.max(0, Math.trunc(place)), 5) : 0;
  return byPlace[index] ?? 1;
}

/**
 * What a series is painted with: the fill of its marks and swatches, and the colour of text
 * printed on that fill (the share in a tall `SegmentedBar`). Server-safe: both are CSS
 * variables, resolved by the ground the chart stands on.
 */
export function seriesPaint(color: SeriesColor): SeriesPaint {
  return color === "muted"
    ? { fill: "var(--lf-series-muted)", on: "var(--lf-on-series-muted)" }
    : { fill: `var(--lf-series-${color})`, on: `var(--lf-on-series-${color})` };
}

/**
 * The paint of one series of several: its named colour, or the one of its place among them.
 * A chart with a single series asks its `tone` first and comes here only for a named colour.
 */
export function seriesPaintOf(color: SeriesColor | undefined, place: number): SeriesPaint {
  return seriesPaint(color ?? seriesColorAt(place));
}
