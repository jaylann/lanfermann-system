/**
 * The outline of what is chosen in a month's grid, as one shape.
 *
 * A range that runs over several weeks is a stair: the first week from its first day to Sunday,
 * whole weeks, the last week from Monday to its last day. Drawn as one outline it reads as one
 * thing: round where it turns outwards, round where the rows step inwards, no line where two
 * weeks meet. (Two weeks that do not stand above each other anywhere, Saturday to Tuesday, stay
 * two pieces: there is nothing to join.)
 *
 * There are two ways to get it:
 *
 * - `rangeOutline`, at rest: the points of a CSS `polygon()` with every length written in the
 *   calendar's own units (`--u` the pitch from one day to the next, `--g` the gap between days,
 *   `--r` the corner radius). The shape follows the density and the pointer without being
 *   measured, and can be rendered on a server.
 * - `spanOutline`, on the way from one selection to the next: the same shape in pixels, for
 *   rows and columns that need not be whole. Whatever the numbers, it is a proper outline that
 *   never crosses itself, so a selection can glide to its new place and be drawn at every
 *   instant: a new week grows out of the edge, a neck between two weeks thins and lets go.
 *
 * A quarter circle is drawn as a few short lines; at this size the eye cannot tell.
 *
 * Pure data and functions: no "use client", safe to test without a browser.
 */
import { weekdayIndex } from "@/internal/iso-date";

/** A length as a sum: so many pitches, gaps, radii and pixels. */
export type Length = { u: number; g: number; r: number; px: number };
export type Point = { x: Length; y: Length };

type Direction = readonly [number, number];
type Corner = { x: Length; y: Length; in: Direction; out: Direction };

const RIGHT: Direction = [1, 0];
const DOWN: Direction = [0, 1];
const LEFT: Direction = [-1, 0];
const UP: Direction = [0, -1];

/** The lines a quarter circle is drawn with. */
const ARC_STEPS = 6;

const length = (u: number, g = 0): Length => ({ u, g, r: 0, px: 0 });
/** The start edge of a column or row, and its end edge: one gap short of the next start. */
const start = (index: number) => length(index);
const end = (index: number) => length(index + 1, -1);

/** The four corners of one row's part of the range, clockwise from its top left. */
function bar(row: number, from: number, to: number): Corner[] {
  return [
    { x: start(from), y: start(row), in: UP, out: RIGHT },
    { x: end(to), y: start(row), in: RIGHT, out: DOWN },
    { x: end(to), y: end(row), in: DOWN, out: LEFT },
    { x: start(from), y: end(row), in: LEFT, out: UP },
  ];
}

/**
 * The corners of the range, clockwise, as one or two pieces. `first` and `last` are the columns
 * (0 to 6) of its first and last day, `rows` how many weeks it touches, `top` the row of the
 * first of them.
 */
function corners(first: number, last: number, rows: number, top: number): Corner[][] {
  const bottom = top + rows - 1;
  if (rows === 1) return [bar(top, first, last)];
  // Two weeks with no column in common: two bars.
  if (rows === 2 && last < first) return [bar(top, first, 6), bar(bottom, 0, last)];

  const outline: Corner[] = [
    { x: start(first), y: start(top), in: UP, out: RIGHT },
    { x: end(6), y: start(top), in: RIGHT, out: DOWN },
  ];
  if (last === 6) {
    outline.push({ x: end(6), y: end(bottom), in: DOWN, out: LEFT });
  } else {
    // The step at the end: in along the bottom of the week before, down to the last day.
    outline.push(
      { x: end(6), y: end(bottom - 1), in: DOWN, out: LEFT },
      { x: end(last), y: end(bottom - 1), in: LEFT, out: DOWN },
      { x: end(last), y: end(bottom), in: DOWN, out: LEFT },
    );
  }
  outline.push({ x: start(0), y: end(bottom), in: LEFT, out: UP });
  if (first > 0) {
    // The step at the start: in along the top of the second week, up to the first day.
    outline.push(
      { x: start(0), y: start(top + 1), in: UP, out: RIGHT },
      { x: start(first), y: start(top + 1), in: RIGHT, out: UP },
    );
  }
  return [outline];
}

/**
 * One corner as the points of its arc. `grow` pushes the outline outwards by that many pixels
 * (for the edge drawn around the shape): the corner moves out along both of its sides, an outer
 * arc gets that much larger and an inner one that much smaller.
 */
function arc(corner: Corner, grow: number): Point[] {
  const [inX, inY] = corner.in;
  const [outX, outY] = corner.out;
  // Clockwise on a screen, a turn to the right is an outer corner.
  const outer = inX * outY - inY * outX > 0;
  const radiusPx = outer ? grow : -grow;
  // The outward side of a line that runs in direction (x, y) is (y, -x).
  const moveX = grow * (inY + outY);
  const moveY = grow * (-inX - outX);

  const points: Point[] = [];
  for (let step = 0; step <= ARC_STEPS; step++) {
    const angle = (step / ARC_STEPS) * (Math.PI / 2);
    const along = Math.sin(angle) - 1;
    const across = 1 - Math.cos(angle);
    const kx = inX * along + outX * across;
    const ky = inY * along + outY * across;
    points.push({
      x: { ...corner.x, r: kx, px: corner.x.px + moveX + radiusPx * kx },
      y: { ...corner.y, r: ky, px: corner.y.px + moveY + radiusPx * ky },
    });
  }
  return points;
}

/** Pieces as one list: two are joined by a line there and back, which encloses nothing. */
function joined<P>(pieces: P[][]): P[] {
  if (pieces.length === 1) return pieces[0]!;
  return pieces.flatMap((piece) => [...piece, piece[0]!]);
}

/** The outline of a range at rest as points, clockwise from the top left of its first day. */
export function rangeOutline(
  first: number,
  last: number,
  rows: number,
  grow = 0,
  top = 0,
): Point[] {
  return joined(
    corners(first, last, rows, top).map((piece) => piece.flatMap((corner) => arc(corner, grow))),
  );
}

const term = (factor: number, unit: string) => {
  const rounded = Math.round(factor * 10000) / 10000;
  return rounded === 0 ? "" : ` + ${rounded}${unit}`;
};

/** A length as CSS. `pad` is added to every one: the room the drawing keeps around the grid. */
function css(value: Length, pad: number) {
  const sum =
    term(value.u, "*var(--u)") +
    term(value.g, "*var(--g)") +
    term(value.r, "*var(--r)") +
    term(value.px + pad, "px");
  return sum === "" ? "0px" : `calc(${sum.slice(3)})`;
}

/** Points as the list a `polygon()` takes. */
export function polygonPoints(points: Point[], pad = 0): string {
  return points.map((point) => `${css(point.x, pad)} ${css(point.y, pad)}`).join(", ");
}

/** A length in pixels, for given sizes of the units. */
export function resolve(value: Length, sizes: { u: number; g: number; r: number }): number {
  return value.u * sizes.u + value.g * sizes.g + value.r * sizes.r + value.px;
}

// --- on the way ----------------------------------------------------------------------------------

/** What is chosen, as rows and columns of the grid. On the way they need not be whole numbers. */
export type Span = { top: number; first: number; bottom: number; last: number };
/** The sizes of a grid in pixels: a day, the gap between two, the corner. */
export type GridSizes = { cell: number; gap: number; radius: number };
type Pixel = [number, number];

/** A piece never gets thinner than this, in px: thinner, its corners could not be drawn. */
const THINNEST = 1;

const box = (left: number, top: number, right: number, bottom: number): Pixel[] => [
  [left, top],
  [right, top],
  [right, bottom],
  [left, bottom],
];

/**
 * A polygon whose sides run along the grid, with its corners rounded. A corner is never rounder
 * than half of its shorter side, so two corners close together share that side instead of
 * running into each other. `grow` as in `arc`.
 */
function rounded(corners: Pixel[], radius: number, grow: number): Pixel[] {
  // Corners that are no corners: the same place twice, or a point on a straight side.
  const turns = corners.filter((corner, index) => {
    const before = corners[(index + corners.length - 1) % corners.length]!;
    const after = corners[(index + 1) % corners.length]!;
    const same = Math.abs(corner[0] - before[0]) + Math.abs(corner[1] - before[1]) < 1e-6;
    const straight =
      (Math.abs(corner[0] - before[0]) < 1e-6 && Math.abs(after[0] - corner[0]) < 1e-6) ||
      (Math.abs(corner[1] - before[1]) < 1e-6 && Math.abs(after[1] - corner[1]) < 1e-6);
    return !same && !straight;
  });

  return turns.flatMap(([x, y], index) => {
    const before = turns[(index + turns.length - 1) % turns.length]!;
    const after = turns[(index + 1) % turns.length]!;
    const lengthIn = Math.abs(x - before[0]) + Math.abs(y - before[1]);
    const lengthOut = Math.abs(after[0] - x) + Math.abs(after[1] - y);
    const inX = (x - before[0]) / lengthIn;
    const inY = (y - before[1]) / lengthIn;
    const outX = (after[0] - x) / lengthOut;
    const outY = (after[1] - y) / lengthOut;
    const outer = inX * outY - inY * outX > 0;
    const fit = Math.min(radius, lengthIn / 2, lengthOut / 2);
    const r = outer ? fit + grow : Math.max(0, fit - grow);
    const cornerX = x + grow * (inY + outY);
    const cornerY = y + grow * (-inX - outX);
    return Array.from({ length: ARC_STEPS + 1 }, (_, step): Pixel => {
      const angle = (step / ARC_STEPS) * (Math.PI / 2);
      const along = Math.sin(angle) - 1;
      const across = 1 - Math.cos(angle);
      return [
        cornerX + r * (inX * along + outX * across),
        cornerY + r * (inY * along + outY * across),
      ];
    });
  });
}

/**
 * The outline of a span in pixels, clockwise. For whole rows and columns it is the shape
 * `rangeOutline` draws. In between it is what lies between two sliding marks: the first day's
 * week from its left edge on, the last day's week up to its right edge, and everything between
 * those two weeks. So as the numbers move, weeks grow out of an edge as slivers, and the neck
 * between two weeks thins to nothing before they part.
 */
export function spanOutline(span: Span, sizes: GridSizes, grow = 0): Pixel[] {
  const pitch = sizes.cell + sizes.gap;
  const width = 7 * pitch - sizes.gap;
  const left = Math.min(span.first * pitch, width - THINNEST);
  const right = Math.max((span.last + 1) * pitch - sizes.gap, THINNEST);
  // The first week reaches down to the top of the next, the last week up to the bottom of the
  // one before: where the two bands overlap, both ends hold.
  const top = span.top * pitch;
  const firstEnds = top + pitch;
  const lastBegins = span.bottom * pitch - sizes.gap;
  const bottom = span.bottom * pitch + sizes.cell;
  const round = (corners: Pixel[]) => rounded(corners, sizes.radius, grow);

  // One week: between the two marks.
  if (lastBegins <= top) return round(box(left, top, Math.max(right, left + THINNEST), bottom));
  // Two weeks that share no column: two bars.
  if (lastBegins < firstEnds && left > right) {
    return joined([
      round(box(left, top, width, lastBegins)),
      round(box(0, firstEnds, right, bottom)),
    ]);
  }
  return round([
    [left, top],
    [width, top],
    [width, lastBegins],
    [right, lastBegins],
    [right, bottom],
    [0, bottom],
    [0, firstEnds],
    [left, firstEnds],
  ]);
}

/** Pixels as the list a `polygon()` takes. `pad` as in `polygonPoints`. */
export function pixelPoints(points: Pixel[], pad = 0): string {
  const px = (value: number) => `${Math.round((value + pad) * 100) / 100}px`;
  return points.map(([x, y]) => `${px(x)} ${px(y)}`).join(", ");
}

const DAY = 86_400_000;
// Rounded, because a day is 23 or 25 hours long when the clocks change.
const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / DAY);

/** The Monday on or before the 1st of a month: where its grid of six weeks begins. */
function gridStart(month: Date): Date {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  return new Date(
    firstOfMonth.getFullYear(),
    firstOfMonth.getMonth(),
    1 - weekdayIndex(firstOfMonth),
  );
}

/** The 42 days in the grid of a month, row by row. */
export function gridDays(month: Date): Date[] {
  const begin = gridStart(month);
  return Array.from(
    { length: 42 },
    (_, index) => new Date(begin.getFullYear(), begin.getMonth(), begin.getDate() + index),
  );
}

/**
 * Where a range stands in the grid of one month: the columns of its first and last day there,
 * the row of the first, and how many rows it touches. The grid starts on the Monday on or
 * before the 1st and shows six weeks; a range that begins before it or goes on after it is cut
 * at its edge. `undefined` if none of the range is in the grid.
 */
export function rangeInGrid(
  month: Date,
  from: Date,
  to: Date,
): { first: number; last: number; top: number; rows: number } | undefined {
  const begin = Math.max(0, daysBetween(gridStart(month), from));
  const finish = Math.min(41, daysBetween(gridStart(month), to));
  if (begin > finish) return undefined;
  const top = Math.floor(begin / 7);
  return { first: begin % 7, last: finish % 7, top, rows: Math.floor(finish / 7) - top + 1 };
}
