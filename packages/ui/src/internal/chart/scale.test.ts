import { describe, expect, it } from "vitest";

import { bands, extent, nearest, niceStep, share, valueAxis } from "./scale";

describe("the extent of values", () => {
  it("skips gaps", () => {
    expect(extent([3, null, -2, undefined, Number.NaN, 7])).toEqual([-2, 7]);
  });

  it("is nothing without a value", () => {
    expect(extent([null, undefined])).toBeUndefined();
  });
});

describe("a round step", () => {
  it.each([
    [10, 4, 2.5],
    [12_480, 4, 5000],
    [1, 4, 0.25],
    [0.3, 3, 0.1],
    [100, 5, 20],
  ])("marks %s in about %s parts with %s", (span, count, step) => {
    expect(niceStep(span, count)).toBeCloseTo(step, 10);
  });
});

describe("a value axis", () => {
  it("encloses the values from zero with round lines", () => {
    expect(valueAxis([1200, 12_480])).toEqual({
      domain: [0, 15_000],
      ticks: [0, 5000, 10_000, 15_000],
    });
  });

  it("may float when zero is not asked for", () => {
    const { domain, ticks } = valueAxis([96, 104], { zero: false });
    expect(domain[0]).toBeLessThanOrEqual(96);
    expect(domain[1]).toBeGreaterThanOrEqual(104);
    expect(ticks[0]).toBeGreaterThan(0);
  });

  it("reaches below zero for losses", () => {
    const { domain, ticks } = valueAxis([-320, 900]);
    expect(domain[0]).toBeLessThanOrEqual(-320);
    expect(ticks).toContain(0);
  });

  it("gives equal values room", () => {
    expect(valueAxis([5, 5]).domain).toEqual([0, 6]);
    expect(valueAxis([0, 0]).domain).toEqual([0, 1]);
    const floating = valueAxis([5, 5], { zero: false });
    expect(floating.domain[0]).toBeLessThan(5);
    expect(floating.domain[1]).toBeGreaterThan(5);
  });

  it("has no float noise in its lines", () => {
    for (const tick of valueAxis([0, 0.7], { count: 7 }).ticks) {
      expect(String(tick).length).toBeLessThanOrEqual(4);
    }
  });

  it("stands at nothing at all without values", () => {
    expect(valueAxis(undefined)).toEqual({ domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1] });
  });
});

describe("shares and places", () => {
  it("puts a value on its domain", () => {
    expect(share(5, [0, 10])).toBe(0.5);
    expect(share(5, [5, 5])).toBe(0);
  });

  it("splits categories into bands with half a gap at either end", () => {
    const three = bands(3, 0.3);
    expect(three).toHaveLength(3);
    expect(three[0]!.start).toBeCloseTo(0.05);
    expect(three[2]!.start + three[2]!.width).toBeCloseTo(0.95);
  });

  it("finds the nearest place", () => {
    const places = [0, 0.25, 0.5, 0.75, 1];
    expect(nearest(places, -1)).toBe(0);
    expect(nearest(places, 0.3)).toBe(1);
    expect(nearest(places, 0.4)).toBe(2);
    expect(nearest(places, 2)).toBe(4);
    expect(nearest([], 0.5)).toBe(-1);
    expect(nearest([0.5], 0.9)).toBe(0);
  });
});
