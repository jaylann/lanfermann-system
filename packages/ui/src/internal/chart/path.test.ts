import { describe, expect, it } from "vitest";

import { areaPath, linePath, type MaybePoint, resample, runs, SIZE } from "./path";

/** Every number of a path, in order. */
const numbers = (path: string) => (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

/** The y values a cubic segment passes through, sampled. */
function curveYs(path: string) {
  const ys: number[] = [];
  let y0 = 0;
  for (const [, command, args] of path.matchAll(/([MLC])([^MLCZ]*)/g)) {
    const values = numbers(args!);
    if (command === "M" || command === "L") {
      y0 = values[1]!;
      ys.push(y0);
    } else {
      const [, y1, , y2, , y3] = values as [number, number, number, number, number, number];
      for (let step = 1; step <= 20; step++) {
        const t = step / 20;
        const u = 1 - t;
        ys.push(u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3);
      }
      y0 = y3;
    }
  }
  return ys;
}

const series = (ys: (number | null)[]): MaybePoint[] =>
  ys.map((y, index) => (y === null ? null : { x: index / (ys.length - 1), y }));

describe("a line through a series", () => {
  it("starts and ends on its points", () => {
    const path = linePath(series([0.5, 0.2, 0.8]), "smooth");
    expect(path.startsWith("M0,500")).toBe(true);
    expect(path.endsWith(`${SIZE},800`)).toBe(true);
  });

  it("goes straight when asked to", () => {
    expect(linePath(series([0.5, 0.2, 0.8]), "linear")).toBe("M0,500L500,200L1000,800");
  });

  it("never overshoots a peak or a valley", () => {
    const ys = [0.9, 0.9, 0.1, 0.1, 0.6, 0.2, 0.9];
    const drawn = curveYs(linePath(series(ys), "smooth")).map((y) => y / SIZE);
    expect(Math.min(...drawn)).toBeGreaterThanOrEqual(Math.min(...ys) - 1e-9);
    expect(Math.max(...drawn)).toBeLessThanOrEqual(Math.max(...ys) + 1e-9);
  });

  it("does not fall where the series does not", () => {
    const rising = [0.9, 0.85, 0.5, 0.48, 0.1];
    const drawn = curveYs(linePath(series(rising), "smooth"));
    for (let index = 1; index < drawn.length; index++) {
      expect(drawn[index]!).toBeLessThanOrEqual(drawn[index - 1]! + 1e-9);
    }
  });

  it("breaks at gaps", () => {
    const path = linePath(series([0.2, 0.3, null, 0.5, 0.6]), "linear");
    expect(path.match(/M/g)).toHaveLength(2);
    expect(runs(series([null, 0.1, null]))).toHaveLength(1);
  });

  it("is one point where there is one", () => {
    // A line of no length: round caps draw it as a dot, where a move alone draws nothing.
    expect(linePath([{ x: 0.5, y: 0.5 }])).toBe("M500,500L500,500");
    expect(linePath([])).toBe("");
  });

  it("draws a value that stands between two gaps", () => {
    expect(linePath(series([0.2, null, 0.5, null, 0.6]), "linear")).toBe(
      "M0,200L0,200M500,500L500,500M1000,600L1000,600",
    );
  });
});

describe("an area under a series", () => {
  it("closes on the baseline", () => {
    const path = areaPath(series([0.5, 0.2]), 1, "linear");
    expect(path).toBe("M0,500L1000,200L1000,1000L0,1000Z");
  });

  it("is one shape per run", () => {
    expect(areaPath(series([0.5, null, 0.2, 0.4]), 1).match(/Z/g)).toHaveLength(2);
  });
});

describe("a series on other places", () => {
  it("reads values off its segments and holds its ends", () => {
    const old = series([0, 1]);
    expect(resample(old, [-0.5, 0, 0.25, 1, 1.5])).toEqual([0, 0, 0.25, 1, 1]);
  });

  it("is a gap where it never had a value", () => {
    expect(resample([null, null], [0, 1])).toEqual([null, null]);
  });
});
