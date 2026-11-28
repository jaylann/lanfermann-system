/**
 * The outlines of a chart's marks, as SVG path data.
 *
 * Points come as shares (x and y from 0 to 1, y downwards as on screen) and are written into a
 * box of `SIZE` by `SIZE` units: the chart's `<svg>` stretches that box over the plot with
 * `preserveAspectRatio="none"` and keeps its strokes at their width with
 * `vector-effect: non-scaling-stroke`. A curve survives that stretch: the monotone cubic below
 * picks its tangents from slopes, and stretching x and y scales every slope alike, so the
 * stretched curve is the curve of the stretched points.
 *
 * Pure and server-safe.
 */

/** The side of the square every path is written in. */
export const SIZE = 1000;

export type Point = { x: number; y: number };

/** A point, or a gap where the series has no value. */
export type MaybePoint = Point | null;

export type Curve = "smooth" | "linear";

const fixed = (value: number) => {
  const text = (value * SIZE).toFixed(2);
  // Trim what says nothing: "120.50" to "120.5", "120.00" to "120".
  return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
};

/** The runs of a series between its gaps. */
export function runs(points: readonly MaybePoint[]): Point[][] {
  const result: Point[][] = [];
  let run: Point[] = [];
  for (const point of points) {
    if (point) run.push(point);
    else if (run.length > 0) {
      result.push(run);
      run = [];
    }
  }
  if (run.length > 0) result.push(run);
  return result;
}

const sign = (value: number) => (value < 0 ? -1 : value > 0 ? 1 : 0);

/**
 * The tangent at the middle of three points (Fritsch–Carlson, as Steffen and d3's monotoneX
 * have it): zero where the series turns, so the curve never overshoots a peak or a valley and a
 * series that never falls is never drawn falling.
 */
function middleSlope(a: Point, b: Point, c: Point) {
  const h0 = b.x - a.x;
  const h1 = c.x - b.x;
  const s0 = h0 ? (b.y - a.y) / h0 : 0;
  const s1 = h1 ? (c.y - b.y) / h1 : 0;
  const p = h0 + h1 ? (s0 * h1 + s1 * h0) / (h0 + h1) : 0;
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

/** The tangent at an end, from the one next to it. */
function endSlope(a: Point, b: Point, next: number) {
  const h = b.x - a.x;
  return h ? ((3 * (b.y - a.y)) / h - next) / 2 : next;
}

/** One run as a path, starting with a move to its first point. */
function runPath(run: readonly Point[], curve: Curve): string {
  const first = run[0]!;
  let path = `M${fixed(first.x)},${fixed(first.y)}`;
  // One point by itself (one row, or a value between two gaps): a line of no length, which the
  // round caps draw as a dot of the line's width. A move alone would draw nothing.
  if (run.length === 1) return `${path}L${fixed(first.x)},${fixed(first.y)}`;
  if (curve === "linear" || run.length === 2) {
    for (const point of run.slice(1)) path += `L${fixed(point.x)},${fixed(point.y)}`;
    return path;
  }
  const slopes = run.map((point, index) =>
    index === 0 || index === run.length - 1
      ? 0
      : middleSlope(run[index - 1]!, point, run[index + 1]!),
  );
  slopes[0] = endSlope(run[0]!, run[1]!, slopes[1]!);
  const last = run.length - 1;
  slopes[last] = endSlope(run[last]!, run[last - 1]!, slopes[last - 1]!);
  for (let index = 1; index < run.length; index++) {
    const a = run[index - 1]!;
    const b = run[index]!;
    const third = (b.x - a.x) / 3;
    path +=
      `C${fixed(a.x + third)},${fixed(a.y + third * slopes[index - 1]!)}` +
      ` ${fixed(b.x - third)},${fixed(b.y - third * slopes[index]!)}` +
      ` ${fixed(b.x)},${fixed(b.y)}`;
  }
  return path;
}

/** The line through a series, broken where it has gaps. */
export function linePath(points: readonly MaybePoint[], curve: Curve = "smooth"): string {
  return runs(points)
    .map((run) => runPath(run, curve))
    .join("");
}

/**
 * The area between a series and its baseline (`base`, a share of the height: where zero
 * stands), one closed shape per run.
 */
export function areaPath(
  points: readonly MaybePoint[],
  base: number,
  curve: Curve = "smooth",
): string {
  return runs(points)
    .map((run) => {
      const first = run[0]!;
      const last = run[run.length - 1]!;
      return `${runPath(run, curve)}L${fixed(last.x)},${fixed(base)}L${fixed(first.x)},${fixed(base)}Z`;
    })
    .join("");
}

/**
 * A series put onto other x places, read off its straight segments: the shape a line had,
 * standing on the places of the points that replace it, so the one can turn into the other point
 * by point. Before its first point and after its last it holds its end value.
 */
export function resample(
  points: readonly MaybePoint[],
  places: readonly number[],
): (number | null)[] {
  const known = points.filter((point): point is Point => point !== null);
  if (known.length === 0) return places.map(() => null);
  return places.map((x) => {
    if (x <= known[0]!.x) return known[0]!.y;
    const last = known[known.length - 1]!;
    if (x >= last.x) return last.y;
    let index = 1;
    while (known[index]!.x < x) index++;
    const a = known[index - 1]!;
    const b = known[index]!;
    return b.x === a.x ? b.y : a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
  });
}
