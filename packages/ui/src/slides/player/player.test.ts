import { describe, expect, it } from "vitest";

import { hashOfSlide, slideFromHash } from "./hash";
import { intentOfKey, intentOfSwipe } from "./input";
import { elapsed, initialState, reduce } from "./state";

describe("the player's state", () => {
  const start = initialState(10);

  it("steps forward and back, and stops at both ends", () => {
    expect(reduce(start, { type: "previous" }).index).toBe(0);
    expect(reduce(start, { type: "next", at: 1 }).index).toBe(1);
    const last = reduce(start, { type: "last" });
    expect(last.index).toBe(9);
    expect(reduce(last, { type: "next", at: 1 }).index).toBe(9);
    expect(reduce(last, { type: "first" }).index).toBe(0);
  });

  it("goes to a slide and keeps inside the deck", () => {
    expect(reduce(start, { type: "go", index: 4 }).index).toBe(4);
    expect(reduce(start, { type: "go", index: 99 }).index).toBe(9);
    expect(reduce(start, { type: "go", index: -3 }).index).toBe(0);
    expect(reduce(start, { type: "go", index: Number.NaN }).index).toBe(0);
    expect(initialState(0).index).toBe(0);
  });

  it("starts the clock with the first step forward and keeps it", () => {
    const first = reduce(start, { type: "next", at: 1000 });
    expect(first.startedAt).toBe(1000);
    expect(reduce(first, { type: "next", at: 5000 }).startedAt).toBe(1000);
    expect(reduce(first, { type: "resetTimer", at: 9000 }).startedAt).toBe(9000);
    expect(reduce(start, { type: "go", index: 3 }).startedAt).toBeNull();
  });

  it("ends the black screen and closes the grid when it moves", () => {
    const dark = reduce(reduce(start, { type: "blackout" }), { type: "grid" });
    expect(dark).toMatchObject({ blackout: true, grid: true });
    expect(reduce(dark, { type: "next", at: 1 })).toMatchObject({ blackout: false, grid: false });
  });

  it("leaves the grid first, then the black screen", () => {
    const both = { ...start, grid: true, blackout: true };
    const once = reduce(both, { type: "escape" });
    expect(once).toMatchObject({ grid: false, blackout: true });
    expect(reduce(once, { type: "escape" }).blackout).toBe(false);
  });

  it("takes over what the presenter's window says, without touching its own grid", () => {
    const open = { ...start, grid: true };
    expect(reduce(open, { type: "sync", index: 6, blackout: true })).toMatchObject({
      index: 6,
      blackout: true,
      grid: true,
    });
  });

  it("writes the time of the talk as minutes and seconds", () => {
    expect(elapsed(null, 5000)).toBe("0:00");
    expect(elapsed(1000, 66_000)).toBe("1:05");
    expect(elapsed(0, 3_725_000)).toBe("62:05");
  });
});

describe("deep links", () => {
  const ids = ["cover", "recherche", undefined, "befunde"];

  it("reads a page and an id, and nothing else", () => {
    expect(slideFromHash("#/1", ids)).toBe(0);
    expect(slideFromHash("#/4", ids)).toBe(3);
    expect(slideFromHash("#/befunde", ids)).toBe(3);
    expect(slideFromHash("#/5", ids)).toBeUndefined();
    expect(slideFromHash("#/0", ids)).toBeUndefined();
    expect(slideFromHash("#/nichts", ids)).toBeUndefined();
    expect(slideFromHash("#befunde", ids)).toBeUndefined();
    expect(slideFromHash("", ids)).toBeUndefined();
  });

  it("writes the page of a slide", () => {
    expect(hashOfSlide(0)).toBe("#/1");
    expect(slideFromHash(hashOfSlide(2), ids)).toBe(2);
  });
});

describe("keys and swipes", () => {
  it("moves on arrows, Space and a clicker's PageDown and PageUp", () => {
    for (const key of ["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"]) {
      expect(intentOfKey({ key })).toBe("next");
    }
    for (const key of ["ArrowLeft", "ArrowUp", "PageUp", "Backspace"]) {
      expect(intentOfKey({ key })).toBe("previous");
    }
    expect(intentOfKey({ key: " ", shiftKey: true })).toBe("previous");
    expect(intentOfKey({ key: "Home" })).toBe("first");
    expect(intentOfKey({ key: "End" })).toBe("last");
  });

  it("knows the letters in either case, and leaves the browser its shortcuts", () => {
    expect(intentOfKey({ key: "b" })).toBe("blackout");
    expect(intentOfKey({ key: "B" })).toBe("blackout");
    expect(intentOfKey({ key: "." })).toBe("blackout");
    expect(intentOfKey({ key: "g" })).toBe("grid");
    expect(intentOfKey({ key: "F" })).toBe("fullscreen");
    expect(intentOfKey({ key: "Escape" })).toBe("escape");
    expect(intentOfKey({ key: "f", metaKey: true })).toBeUndefined();
    expect(intentOfKey({ key: "ArrowLeft", altKey: true })).toBeUndefined();
    expect(intentOfKey({ key: "x" })).toBeUndefined();
  });

  it("takes a swipe only when it is long and flat", () => {
    expect(intentOfSwipe(-120, 10)).toBe("next");
    expect(intentOfSwipe(120, -10)).toBe("previous");
    expect(intentOfSwipe(-40, 0)).toBeUndefined();
    expect(intentOfSwipe(-120, 100)).toBeUndefined();
  });
});
