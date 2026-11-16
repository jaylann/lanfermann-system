import { describe, expect, it } from "vitest";

import { parseIsoDate, toIsoDate } from "./iso-date";
import {
  gridDays,
  pixelPoints,
  polygonPoints,
  rangeInGrid,
  rangeOutline,
  resolve,
  type Span,
  spanOutline,
} from "./range-shape";

// A day of 32px, 2px apart, corners of 6px.
const SIZES = { u: 34, g: 2, r: 6 };
const CELL = SIZES.u - SIZES.g;
const day = (iso: string) => parseIsoDate(iso)!;

const pixels = (first: number, last: number, rows: number, grow = 0, top = 0) =>
  rangeOutline(first, last, rows, grow, top).map(
    (point) => [resolve(point.x, SIZES), resolve(point.y, SIZES)] as const,
  );

/** The area a polygon encloses (positive when it runs clockwise on a screen). */
function area(points: (readonly [number, number])[]) {
  let sum = 0;
  points.forEach(([x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % points.length]!;
    sum += x * nextY - nextX * y;
  });
  return sum / 2;
}

/** What rounding one corner takes away from a square corner (or adds to an inner one). */
const ROUNDED = (1 - Math.PI / 4) * SIZES.r ** 2;
/** Areas agree to a few square pixels: an arc is drawn as short lines. */
const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected), `${actual} is not near ${expected}`).toBeLessThan(4);
const bounds = (points: (readonly [number, number])[]) => ({
  left: Math.min(...points.map(([x]) => x)),
  right: Math.max(...points.map(([x]) => x)),
  top: Math.min(...points.map(([, y]) => y)),
  bottom: Math.max(...points.map(([, y]) => y)),
});

describe("the outline of a range", () => {
  it("is a rounded bar within one week", () => {
    const points = pixels(2, 4, 1); // Wednesday to Friday
    expect(bounds(points)).toEqual({
      left: 68,
      right: 68 + 3 * CELL + 2 * 2,
      top: 0,
      bottom: CELL,
    });
    near(area(points), (3 * CELL + 4) * CELL - 4 * ROUNDED);
  });

  it("joins weeks that stand above each other into one stair", () => {
    // Thursday of one week to Tuesday two weeks on: 4 days, a whole week, 2 days.
    const points = pixels(3, 1, 3);
    const width = 7 * CELL + 6 * 2;
    expect(bounds(points)).toEqual({ left: 0, right: width, top: 0, bottom: 3 * CELL + 4 });
    const days =
      (4 * CELL + 3 * 2) * SIZES.u + // the first week and the gap under it
      width * CELL + // the whole week
      (2 * CELL + 2) * SIZES.u; // the last week and the gap above it
    // Six outer corners lose their square tip, the two inner ones gain a fillet.
    near(area(points), days - 6 * ROUNDED + 2 * ROUNDED);
  });

  it("has no step where the range fills its first or last week", () => {
    // Monday to Sunday over three weeks is a plain rounded block.
    const points = pixels(0, 6, 3);
    near(area(points), (7 * CELL + 12) * (3 * CELL + 4) - 4 * ROUNDED);
  });

  it("stands in the row it is given", () => {
    const high = bounds(pixels(2, 4, 1));
    const low = bounds(pixels(2, 4, 1, 0, 3));
    expect(low).toEqual({
      ...high,
      top: high.top + 3 * SIZES.u,
      bottom: high.bottom + 3 * SIZES.u,
    });
  });

  it("joins two weeks through the columns they share", () => {
    // Wednesday to Thursday of the next week: the neck is two days wide.
    const points = pixels(2, 3, 2);
    const top = (5 * CELL + 4 * 2) * CELL;
    const bottom = (4 * CELL + 3 * 2) * CELL;
    const neck = (2 * CELL + 2) * SIZES.g;
    near(area(points), top + bottom + neck - 6 * ROUNDED + 2 * ROUNDED);
  });

  it("leaves two weeks apart that share no column", () => {
    // Saturday to Tuesday: two bars, joined by a line that encloses nothing.
    const points = pixels(5, 1, 2);
    const bars = (2 * CELL + 2) * CELL * 2;
    near(area(points), bars - 8 * ROUNDED);
  });

  it("grows by a pixel all round for the edge", () => {
    const inner = bounds(pixels(3, 1, 3));
    const outer = bounds(pixels(3, 1, 3, 1));
    expect(outer).toEqual({
      left: inner.left - 1,
      right: inner.right + 1,
      top: inner.top - 1,
      bottom: inner.bottom + 1,
    });
    // The ring between the two is a pixel wide along the whole outline: as long as the box
    // around the stair, less what its eight round corners cut short.
    const outline = 2 * (7 * CELL + 12) + 2 * (3 * CELL + 4) - 8 * (2 - Math.PI / 2) * SIZES.r;
    const ring = area(pixels(3, 1, 3, 1)) - area(pixels(3, 1, 3));
    expect(Math.abs(ring - outline)).toBeLessThan(8);
  });

  it("writes its points in the calendar's units", () => {
    const [first, second] = polygonPoints(rangeOutline(2, 4, 1), 2).split(", ");
    // The top left corner starts one radius below the top, at the left edge of Wednesday.
    expect(first).toBe("calc(2*var(--u) + 2px) calc(1*var(--r) + 2px)");
    expect(second).toMatch(/^calc\(2\*var\(--u\) \+ 0\.\d+\*var\(--r\) \+ 2px\) /);
    expect(
      polygonPoints([{ x: { u: 0, g: 0, r: 0, px: 0 }, y: { u: 1, g: -1, r: 0, px: 0 } }]),
    ).toBe("0px calc(1*var(--u) + -1*var(--g))");
  });
});

describe("a span on its way", () => {
  const sizes = { cell: CELL, gap: SIZES.g, radius: SIZES.r };
  const span = (top: number, first: number, bottom: number, last: number): Span => ({
    top,
    first,
    bottom,
    last,
  });
  const outline = (at: Span, grow = 0) => spanOutline(at, sizes, grow);

  it("is the shape at rest for whole rows and columns", () => {
    const cases: [number, number, number, number][] = [
      // first, last, rows, top
      [3, 3, 1, 2], // one day
      [2, 4, 1, 0], // part of a week
      [0, 6, 3, 1], // whole weeks
      [3, 1, 3, 0], // a stair
      [2, 3, 2, 3], // two weeks through a neck
      [5, 1, 2, 2], // two bars
    ];
    for (const [first, last, rows, top] of cases) {
      const moving = outline(span(top, first, top + rows - 1, last));
      const resting = pixels(first, last, rows, 0, top);
      expect(bounds(moving), `${first}-${last} over ${rows}`).toEqual(bounds(resting));
      near(area(moving), area(resting));
      // And grown by a pixel for the edge, the same again.
      near(
        area(outline(span(top, first, top + rows - 1, last), 1)),
        area(pixels(first, last, rows, 1, top)),
      );
    }
  });

  it("changes little when the numbers change little, whatever happens to the shape", () => {
    // From one day, the end runs on into the next week and the start runs back into the one
    // before: the shape passes through a bar, slivers, a neck, two bars and a stair.
    const ways: [Span, Span][] = [
      [span(2, 3, 2, 3), span(2, 3, 3, 1)], // the end goes on to Tuesday of the next week
      [span(2, 3, 3, 1), span(1, 5, 3, 1)], // the start goes back to Saturday of the week before
      [span(3, 1, 3, 5), span(3, 5, 4, 0)], // a diagonal: a bar turns into two
      [span(1, 0, 4, 6), span(4, 6, 4, 6)], // a block falls to one day
      [span(0, 6, 0, 6), span(5, 0, 5, 0)], // one day, from corner to corner
    ];
    for (const [from, to] of ways) {
      let before = area(outline(from));
      for (let step = 1; step <= 400; step++) {
        const t = step / 400;
        const at = span(
          from.top + (to.top - from.top) * t,
          from.first + (to.first - from.first) * t,
          from.bottom + (to.bottom - from.bottom) * t,
          from.last + (to.last - from.last) * t,
        );
        const now = area(outline(at));
        // A four-hundredth of the way never moves more than a fraction of a day's area.
        expect(Math.abs(now - before), `at ${t}`).toBeLessThan(CELL * CELL * 0.35);
        expect(now).toBeGreaterThan(0);
        before = now;
      }
    }
  });

  it("stays within the grid, save for the room a swing past the edge may take", () => {
    const points = outline(span(-0.1, 6.4, 5.1, -0.3));
    for (const [x] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(7 * CELL + 12);
    }
  });

  it("writes its points in pixels", () => {
    expect(
      pixelPoints(
        [
          [0, 1.004],
          [33.333, 2],
        ],
        4,
      ),
    ).toBe("4px 5px, 37.33px 6px");
  });
});

describe("a range in the grid of a month", () => {
  const november = day("2026-11-01"); // its grid runs from 26 October to 6 December
  const place = (from: string, to: string) => rangeInGrid(november, day(from), day(to));

  it("lists the six weeks of a month, from the Monday on or before the 1st", () => {
    const days = gridDays(november).map(toIsoDate);
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-10-26");
    expect(days[6]).toBe("2026-11-01");
    expect(days.at(-1)).toBe("2026-12-06");
    // Across the night the clocks change, every day is still listed once.
    expect(new Set(gridDays(day("2026-10-01")).map(toIsoDate)).size).toBe(42);
  });

  it("finds the columns and rows of a range inside the month", () => {
    expect(place("2026-11-16", "2026-11-27")).toEqual({ first: 0, last: 4, top: 3, rows: 2 });
    expect(place("2026-11-19", "2026-11-19")).toEqual({ first: 3, last: 3, top: 3, rows: 1 });
  });

  it("cuts a range at the edges of the grid", () => {
    expect(place("2026-10-20", "2026-11-03")).toEqual({ first: 0, last: 1, top: 0, rows: 2 });
    expect(place("2026-12-01", "2026-12-24")).toEqual({ first: 1, last: 6, top: 5, rows: 1 });
  });

  it("finds nothing for a range that is not in the grid", () => {
    expect(place("2026-12-10", "2026-12-24")).toBeUndefined();
    expect(place("2026-10-01", "2026-10-20")).toBeUndefined();
  });

  it("is not thrown by the week in which the clocks change", () => {
    const october = day("2026-10-01"); // 25 October has 25 hours
    expect(rangeInGrid(october, day("2026-10-23"), day("2026-10-27"))).toEqual({
      first: 4,
      last: 1,
      top: 3,
      rows: 2,
    });
  });
});
