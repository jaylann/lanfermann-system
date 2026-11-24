import { describe, expect, it } from "vitest";

import { addressFromHash, hashOfSlide, hashToWrite } from "./hash";
import { intentOfKey, intentOfSwipe } from "./input";
import {
  atEnd,
  atStart,
  elapsed,
  initialState,
  type PlayerAction,
  type PlayerState,
  reduce,
  upcoming,
} from "./state";

/** Where the deck stands after `actions`, as `[slide, step]`. */
function walk(state: PlayerState, ...actions: PlayerAction[]): [number, number] {
  const end = actions.reduce(reduce, state);
  return [end.index, end.step];
}

const next: PlayerAction = { type: "next", at: 1 };
const previous: PlayerAction = { type: "previous" };

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
    expect(reduce(open, { type: "sync", index: 6, step: 0, blackout: true })).toMatchObject({
      index: 6,
      step: 0,
      blackout: true,
      grid: true,
    });
  });

  it("never leaves step 0 in a deck whose slides have no steps", () => {
    const states = [
      reduce(start, next),
      reduce(reduce(start, next), previous),
      reduce(start, { type: "last" }),
      reduce(start, { type: "go", index: 4, step: 2 }),
      reduce(start, { type: "sync", index: 4, step: 2, blackout: false }),
    ];
    expect(states.map((state) => state.step)).toEqual([0, 0, 0, 0, 0]);
    expect(initialState(3)).toMatchObject({ count: 3, steps: [0, 0, 0] });
    expect(upcoming(start)).toEqual({ index: 1, step: 0 });
  });

  it("writes the time of the talk as minutes and seconds", () => {
    expect(elapsed(null, 5000)).toBe("0:00");
    expect(elapsed(1000, 66_000)).toBe("1:05");
    expect(elapsed(0, 3_725_000)).toBe("62:05");
  });
});

describe("the steps of a slide", () => {
  // Four slides: the second shows two steps, the last three.
  const deck = initialState([0, 2, 0, 3]);

  it("starts at step 0, and knows each slide's steps", () => {
    expect(deck).toMatchObject({ index: 0, step: 0, count: 4, steps: [0, 2, 0, 3] });
    expect(initialState([0, 2, 0, 3], 1, 1)).toMatchObject({ index: 1, step: 1 });
    expect(initialState([0, 2, 0, 3], 1, 9).step).toBe(2);
    expect(initialState([0, 2, 0, 3], 0, 1).step).toBe(0);
  });

  it("walks a slide's steps before it moves on, and enters the next at step 0", () => {
    expect(walk(deck, next)).toEqual([1, 0]);
    expect(walk(deck, next, next)).toEqual([1, 1]);
    expect(walk(deck, next, next, next)).toEqual([1, 2]);
    expect(walk(deck, next, next, next, next)).toEqual([2, 0]);
  });

  it("walks them back, and enters the slide before at its last step", () => {
    const third = reduce(deck, { type: "go", index: 2 });
    expect(walk(third, previous)).toEqual([1, 2]);
    expect(walk(third, previous, previous)).toEqual([1, 1]);
    expect(walk(third, previous, previous, previous)).toEqual([1, 0]);
    expect(walk(third, previous, previous, previous, previous)).toEqual([0, 0]);
    expect(walk(deck, previous)).toEqual([0, 0]);
  });

  it("stops at the last step of the last slide", () => {
    const last = reduce(deck, { type: "last" });
    expect([last.index, last.step]).toEqual([3, 3]);
    expect(atEnd(last)).toBe(true);
    expect(walk(last, next)).toEqual([3, 3]);
    expect(atEnd(reduce(deck, { type: "go", index: 3 }))).toBe(false);
  });

  it("goes to the first slide at step 0 from anywhere", () => {
    const deep = reduce(deck, { type: "go", index: 3, step: 2 });
    expect(walk(deep, { type: "first" })).toEqual([0, 0]);
    expect(atStart(deep)).toBe(false);
    expect(atStart(reduce(deep, { type: "first" }))).toBe(true);
    expect(atStart(reduce(deck, { type: "go", index: 0, step: 0 }))).toBe(true);
  });

  it("goes to a slide at step 0, or at the step it names, clamped to the slide's", () => {
    expect(walk(deck, { type: "go", index: 1 })).toEqual([1, 0]);
    expect(walk(deck, { type: "go", index: 1, step: 1 })).toEqual([1, 1]);
    expect(walk(deck, { type: "go", index: 1, step: 7 })).toEqual([1, 2]);
    expect(walk(deck, { type: "go", index: 1, step: -2 })).toEqual([1, 0]);
    expect(walk(deck, { type: "go", index: 2, step: 1 })).toEqual([2, 0]);
    expect(walk(deck, { type: "go", index: 99, step: 99 })).toEqual([3, 3]);
    expect(walk(deck, { type: "go", index: 1, step: Number.NaN })).toEqual([1, 0]);
  });

  it("takes over slide and step from the presenter's window, clamped to this deck", () => {
    const synced = reduce(deck, { type: "sync", index: 3, step: 2, blackout: true });
    expect(synced).toMatchObject({ index: 3, step: 2, blackout: true });
    expect(reduce(deck, { type: "sync", index: 1, step: 5, blackout: false }).step).toBe(2);
  });

  it("ends the black screen and closes the grid on a step, too", () => {
    const second = reduce(deck, { type: "go", index: 1 });
    const dark = { ...second, blackout: true, grid: true };
    expect(reduce(dark, next)).toMatchObject({ index: 1, step: 1, blackout: false, grid: false });
    const later = { ...reduce(second, next), blackout: true, grid: true };
    expect(reduce(later, previous)).toMatchObject({ step: 0, blackout: false, grid: false });
  });

  it("starts the clock with the first press forward, also when it is a step", () => {
    const second = reduce(deck, { type: "go", index: 1 });
    const stepped = reduce(second, { type: "next", at: 4000 });
    expect(stepped).toMatchObject({ index: 1, step: 1, startedAt: 4000 });
    expect(reduce(stepped, { type: "next", at: 9000 }).startedAt).toBe(4000);
  });

  it("says what the next press brings: a step of this slide, then the next slide", () => {
    const second = reduce(deck, { type: "go", index: 1 });
    expect(upcoming(second)).toEqual({ index: 1, step: 1 });
    expect(upcoming(reduce(second, { type: "go", index: 1, step: 2 }))).toEqual({
      index: 2,
      step: 0,
    });
    expect(upcoming(reduce(deck, { type: "last" }))).toBeUndefined();
  });
});

describe("deep links", () => {
  const ids = ["cover", "recherche", undefined, "befunde"];

  const slide = (hash: string) => addressFromHash(hash, ids)?.index;

  it("reads a page and an id, and nothing else", () => {
    expect(slide("#/1")).toBe(0);
    expect(slide("#/4")).toBe(3);
    expect(slide("#/befunde")).toBe(3);
    expect(slide("#/5")).toBeUndefined();
    expect(slide("#/0")).toBeUndefined();
    expect(slide("#/nichts")).toBeUndefined();
    expect(slide("#befunde")).toBeUndefined();
    expect(slide("")).toBeUndefined();
    expect(slide("#/%E0%A4")).toBeUndefined();
  });

  it("reads a step after the last dot, and step 0 without one", () => {
    expect(addressFromHash("#/4", ids)).toEqual({ index: 3, step: 0 });
    expect(addressFromHash("#/4.1", ids)).toEqual({ index: 3, step: 1 });
    expect(addressFromHash("#/befunde.2", ids)).toEqual({ index: 3, step: 2 });
    expect(addressFromHash("#/befunde.0", ids)).toEqual({ index: 3, step: 0 });
    expect(addressFromHash("#/2.12", ids)).toEqual({ index: 1, step: 12 });
    expect(addressFromHash("#/5.1", ids)).toBeUndefined();
    expect(addressFromHash("#/.1", ids)).toBeUndefined();
    expect(addressFromHash("#/4.", ids)).toBeUndefined();
    expect(addressFromHash("#/4.x", ids)).toBeUndefined();
  });

  it("takes an id with a dot while it does not end in a dot and digits", () => {
    const dotted = ["teil.eins", "v1", "v1.2"];
    expect(addressFromHash("#/teil.eins", dotted)).toEqual({ index: 0, step: 0 });
    expect(addressFromHash("#/teil.eins.3", dotted)).toEqual({ index: 0, step: 3 });
    // The last dot and digits are always the step: `v1.2` is the slide `v1` at step 2.
    expect(addressFromHash("#/v1.2", dotted)).toEqual({ index: 1, step: 2 });
  });

  it("writes the page of a slide, and its step when it is not 0", () => {
    expect(hashOfSlide(0)).toBe("#/1");
    expect(hashOfSlide(6, 0)).toBe("#/7");
    expect(hashOfSlide(6, 1)).toBe("#/7.1");
    expect(addressFromHash(hashOfSlide(2), ids)).toEqual({ index: 2, step: 0 });
    expect(addressFromHash(hashOfSlide(1, 3), ids)).toEqual({ index: 1, step: 3 });
  });

  it("leaves the address alone while it says where the deck is", () => {
    expect(hashToWrite("#/befunde", ids, 3, 0)).toBeUndefined();
    expect(hashToWrite("#/4", ids, 3, 0)).toBeUndefined();
    expect(hashToWrite("#/4.2", ids, 3, 2)).toBeUndefined();
    expect(hashToWrite("#/befunde.2", ids, 3, 2)).toBeUndefined();
  });

  it("keeps an id when only the step changes, and writes the page on another slide", () => {
    expect(hashToWrite("#/befunde", ids, 3, 2)).toBe("#/befunde.2");
    expect(hashToWrite("#/befunde.2", ids, 3, 0)).toBe("#/befunde");
    expect(hashToWrite("#/befunde.2", ids, 1, 0)).toBe("#/2");
    expect(hashToWrite("#/4", ids, 3, 1)).toBe("#/4.1");
    expect(hashToWrite("#/4.1", ids, 2, 0)).toBe("#/3");
    expect(hashToWrite("", ids, 0, 1)).toBe("#/1.1");
    expect(hashToWrite("#/nichts", ids, 1, 0)).toBe("#/2");
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
