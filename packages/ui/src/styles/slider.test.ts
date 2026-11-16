import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(import.meta.dirname, file), "utf8");

/** The value of a bezier easing at time `t`, both between 0 and 1. */
function bezier([x1, y1, x2, y2]: number[], t: number) {
  const at = (a: number, b: number, u: number) =>
    3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u * u * b + u ** 3;
  let low = 0;
  let high = 1;
  for (let step = 0; step < 30; step++) {
    const middle = (low + high) / 2;
    if (at(x1!, x2!, middle) < t) low = middle;
    else high = middle;
  }
  return at(y1!, y2!, (low + high) / 2);
}

/** The value of a `linear()` easing with evenly spaced points at time `t`. */
function linear(points: number[], t: number) {
  const last = points.length - 1;
  const index = Math.min(Math.floor(t * last), last - 1);
  const from = points[index]!;
  return from + (points[index + 1]! - from) * (t * last - index);
}

const numbers = (css: string, pattern: RegExp) =>
  pattern
    .exec(css)![1]!
    .split(",")
    .map((part) => Number(part.trim()));

describe("slider", () => {
  const chase = numbers(read("slider.css"), /--slider-chase:\s*cubic-bezier\(([^)]+)\)/);
  const snap = numbers(read("motion.generated.css"), /--ease-spring-snap:\s*linear\(([^)]+)\)/);

  it("chases the pointer on the snap spring, written as a bezier", () => {
    for (let step = 1; step < 40; step++) {
      const t = step / 40;
      expect(Math.abs(bezier(chase, t) - linear(snap, t)), `at ${t}`).toBeLessThan(0.02);
    }
  });

  it("keeps that bezier within 0 and 1, which is what Safari's compositor accepts", () => {
    expect(chase).toHaveLength(4);
    for (const value of chase) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
