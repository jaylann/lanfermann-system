import { describe, expect, it } from "vitest";

import { itemAcross, type ItemBox, rangeOf } from "./use-selection";

/** A tile 160 wide and 200 high at a column and a row of a grid with 12px gaps. */
const tile = (id: string, column: number, top: number, height = 200): ItemBox => ({
  id,
  top,
  bottom: top + height,
  left: column * 172,
  right: column * 172 + 160,
});

// Folders: a row of three short tiles. Files: four columns, two rows, under a label.
const BOXES: ItemBox[] = [
  tile("badges", 0, 0, 44),
  tile("entwuerfe", 1, 0, 44),
  tile("archiv", 2, 0, 44),
  tile("hero", 0, 90),
  tile("thumbnail", 1, 90),
  tile("badge", 2, 90),
  tile("logo", 3, 90),
  tile("angebot", 0, 302),
  tile("preise", 1, 302),
];

describe("itemAcross", () => {
  it("goes down to the item in the same column of the next row", () => {
    expect(itemAcross(BOXES, "thumbnail", "down")).toBe("preise");
  });

  it("goes up to the item in the same column of the row above", () => {
    expect(itemAcross(BOXES, "preise", "up")).toBe("thumbnail");
  });

  it("crosses from the short folder row into the files", () => {
    expect(itemAcross(BOXES, "archiv", "down")).toBe("badge");
    expect(itemAcross(BOXES, "logo", "up")).toBe("archiv");
  });

  it("takes the closest item where the next row is shorter", () => {
    expect(itemAcross(BOXES, "logo", "down")).toBe("preise");
  });

  it("has nowhere to go past the first and the last row", () => {
    expect(itemAcross(BOXES, "entwuerfe", "up")).toBeNull();
    expect(itemAcross(BOXES, "angebot", "down")).toBeNull();
  });

  it("knows nothing of an item it was not given", () => {
    expect(itemAcross(BOXES, "gone", "down")).toBeNull();
  });
});

describe("rangeOf", () => {
  const ids = ["a", "b", "c", "d", "e"];

  it("takes the ids between two, both included, in the order shown", () => {
    expect(rangeOf(ids, "b", "d")).toEqual(["b", "c", "d"]);
    expect(rangeOf(ids, "d", "b")).toEqual(["b", "c", "d"]);
  });

  it("is the one id where both ends are the same", () => {
    expect(rangeOf(ids, "c", "c")).toEqual(["c"]);
  });

  it("is only the end where the start is gone", () => {
    expect(rangeOf(ids, "gone", "c")).toEqual(["c"]);
    expect(rangeOf(ids, "c", "gone")).toEqual([]);
  });
});
