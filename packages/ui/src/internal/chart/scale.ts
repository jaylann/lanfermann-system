/**
 * The value side of a chart: where a number stands on its axis, and which round numbers mark it.
 *
 * Every place is a share from 0 to 1, never a length: a chart draws its marks in a box whose
 * size it does not know (the server renders it, the window resizes it), so the share is what
 * stays true. Pure and server-safe.
 */

/** The smallest and the largest of the numbers given, skipping gaps (`null`, `NaN`). */
export function extent(values: Iterable<number | null | undefined>): [number, number] | undefined {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value == null || !Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return min <= max ? [min, max] : undefined;
}

/**
 * A round step for marking `span` with about `count` lines: 1, 2, 2.5 or 5 times a power of ten.
 * 2.5 keeps quarters (0, 250, 500, 750) where 2 would give five lines and 5 only three.
 */
export function niceStep(span: number, count: number): number {
  if (!(span > 0) || !(count > 0)) return 1;
  const raw = span / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

export type ValueAxis = {
  /** The range the axis covers, from its lowest line to its highest. */
  domain: [number, number];
  /** The values of its lines, lowest first. */
  ticks: number[];
};

export type ValueAxisOptions = {
  /** About how many intervals between lines. Three or four read best; the result may differ by one. */
  count?: number;
  /**
   * Whether zero must stand on the axis. Bars and areas grow from zero, so for them it must; a
   * line may float, but a line of amounts that starts at zero tells the truth about their size.
   */
  zero?: boolean;
};

/**
 * The axis for a set of values: round lines that enclose them all. The top line is at or above
 * the largest value, so nothing is drawn above the last line, and a line of equal values still
 * gets an axis of its own (around the value, or from zero to it).
 */
export function valueAxis(
  range: [number, number] | undefined,
  { count = 4, zero = true }: ValueAxisOptions = {},
): ValueAxis {
  let [low, high] = range ?? [0, 1];
  if (zero) {
    low = Math.min(0, low);
    high = Math.max(0, high);
  }
  if (low === high) {
    // One value, or all the same: give it room. Zero alone stands at the bottom of 0 to 1.
    const pad = low === 0 ? 1 : Math.abs(low) * 0.5;
    if (zero && low >= 0) high = low + (low === 0 ? 1 : pad);
    else if (zero && high <= 0) low = high - pad;
    else {
      low -= pad;
      high += pad;
    }
  }
  const step = niceStep(high - low, count);
  const start = Math.floor(low / step + 1e-9) * step;
  const end = Math.ceil(high / step - 1e-9) * step;
  const ticks: number[] = [];
  // Counted, not added up, so 0.1 + 0.2 never drifts into the labels.
  const lines = Math.round((end - start) / step);
  for (let index = 0; index <= lines; index++) ticks.push(roundTo(start + index * step, step));
  return { domain: [start, end], ticks };
}

/** `value` without the float noise of a step: 0.30000000000000004 becomes 0.3. */
function roundTo(value: number, step: number) {
  const places = Math.max(0, -Math.floor(Math.log10(step)) + 2);
  return Number(value.toFixed(Math.min(places, 12)));
}

/** Where `value` stands on `domain`, from 0 (its start) to 1 (its end). */
export function share(value: number, [start, end]: [number, number]): number {
  return end === start ? 0 : (value - start) / (end - start);
}

/**
 * Bands for categories along an axis, as shares: where each band starts and how wide it is.
 * `gap` is the share of a band's step left empty between two bands, half of it at either end.
 */
export function bands(count: number, gap = 0.3): { start: number; width: number }[] {
  if (count <= 0) return [];
  const step = 1 / count;
  const width = step * (1 - gap);
  return Array.from({ length: count }, (_, index) => ({
    start: index * step + (step - width) / 2,
    width,
  }));
}

/**
 * The index of the place nearest to `at` among `places`, which are sorted shares. A binary
 * search: a pointer moving over a year of days asks this on every frame.
 */
export function nearest(places: readonly number[], at: number): number {
  if (places.length === 0) return -1;
  let low = 0;
  let high = places.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (places[middle]! <= at) low = middle;
    else high = middle;
  }
  return Math.abs(places[high]! - at) < Math.abs(places[low]! - at) ? high : low;
}
