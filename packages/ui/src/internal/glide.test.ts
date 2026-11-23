import { describe, expect, it } from "vitest";

import { movesBetween } from "./glide";

const at = (entries: [string, number, number][]) =>
  new Map(entries.map(([key, x, y]) => [key, { x, y }]));

describe("movesBetween", () => {
  it("puts a part that moved back where it was seen", () => {
    expect(movesBetween(at([["a", 180, 0]]), at([["a", 0, 0]]))).toEqual([
      { key: "a", x: 180, y: 0 },
    ]);
  });

  it("moves the tiles after a removed one back by a column and up a row", () => {
    // Three columns of 180: b closes up into a's place, c wraps up from the next row.
    const before = at([
      ["b", 180, 0],
      ["c", 0, 220],
    ]);
    const after = at([
      ["b", 0, 0],
      ["c", 360, 0],
    ]);
    expect(movesBetween(before, after)).toEqual([
      { key: "b", x: 180, y: 0 },
      { key: "c", x: -360, y: 220 },
    ]);
  });

  it("lets a new part fade in where it stands", () => {
    expect(movesBetween(at([]), at([["new", 40, 40]]))).toEqual([]);
  });

  it("leaves what stayed in place, to within half a pixel", () => {
    expect(
      movesBetween(
        at([
          ["a", 10, 10],
          ["b", 20.3, 0],
        ]),
        at([
          ["a", 10, 10],
          ["b", 20, 0],
        ]),
      ),
    ).toEqual([]);
  });

  it("moves a part by half a pixel or more", () => {
    expect(movesBetween(at([["a", 0, 0.5]]), at([["a", 0, 0]]))).toEqual([
      { key: "a", x: 0, y: 0.5 },
    ]);
  });
});
