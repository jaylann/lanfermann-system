import { describe, expect, it } from "vitest";

import { pageRange } from "./pagination";

describe("pageRange", () => {
  it("shows every page while they fit", () => {
    expect(pageRange(1, 1)).toEqual([1]);
    expect(pageRange(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageRange(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("leaves one gap near the start, and gives its place to a number", () => {
    expect(pageRange(1, 12)).toEqual([1, 2, 3, 4, 5, "gap", 12]);
    expect(pageRange(4, 12)).toEqual([1, 2, 3, 4, 5, "gap", 12]);
  });

  it("leaves a gap to both sides in the middle", () => {
    expect(pageRange(5, 12)).toEqual([1, "gap", 4, 5, 6, "gap", 12]);
    expect(pageRange(8, 12)).toEqual([1, "gap", 7, 8, 9, "gap", 12]);
  });

  it("leaves one gap near the end", () => {
    expect(pageRange(9, 12)).toEqual([1, "gap", 8, 9, 10, 11, 12]);
    expect(pageRange(12, 12)).toEqual([1, "gap", 8, 9, 10, 11, 12]);
  });

  it("keeps the same number of places on every page, and always holds the current one", () => {
    for (const pages of [8, 12, 40, 248]) {
      for (let page = 1; page <= pages; page++) {
        const range = pageRange(page, pages);
        expect(range).toHaveLength(7);
        expect(range).toContain(page);
        expect(range[0]).toBe(1);
        expect(range[range.length - 1]).toBe(pages);
      }
    }
  });

  it("widens with more neighbours", () => {
    expect(pageRange(10, 30, 2)).toEqual([1, "gap", 8, 9, 10, 11, 12, "gap", 30]);
    expect(pageRange(1, 30, 2)).toHaveLength(9);
  });

  it("never shows a neighbour twice, nor a gap that hides a single page", () => {
    for (let page = 1; page <= 9; page++) {
      const numbers = pageRange(page, 9).filter((entry) => entry !== "gap");
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });
});
