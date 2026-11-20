import { describe, expect, it } from "vitest";

import { aboveFoot, footOf, glideFrom, movesUp } from "./stick";

describe("aboveFoot", () => {
  it("measures the way to the foot", () => {
    expect(aboveFoot({ scrollTop: 100, scrollHeight: 1000, clientHeight: 500 })).toBe(400);
  });

  it("is nothing at the foot, and never less", () => {
    expect(aboveFoot({ scrollTop: 500, scrollHeight: 1000, clientHeight: 500 })).toBe(0);
    expect(aboveFoot({ scrollTop: 0, scrollHeight: 300, clientHeight: 500 })).toBe(0);
  });
});

describe("footOf", () => {
  it("is where the last line stands at the bottom of the view", () => {
    expect(footOf({ scrollTop: 0, scrollHeight: 1000, clientHeight: 400 })).toBe(600);
    expect(footOf({ scrollTop: 0, scrollHeight: 300, clientHeight: 400 })).toBe(0);
  });
});

describe("movesUp", () => {
  it("knows the keys that read further up", () => {
    for (const key of ["ArrowUp", "PageUp", "Home"]) {
      expect(movesUp({ key, shiftKey: false })).toBe(true);
    }
    expect(movesUp({ key: " ", shiftKey: true })).toBe(true);
    expect(movesUp({ key: " ", shiftKey: false })).toBe(false);
    expect(movesUp({ key: "ArrowDown", shiftKey: false })).toBe(false);
  });
});

describe("glideFrom", () => {
  it("glides a short way from where the view stands", () => {
    expect(glideFrom({ scrollTop: 1000, scrollHeight: 2400, clientHeight: 500 })).toBe(1000);
  });

  it("jumps a long way to a screen above the foot", () => {
    expect(glideFrom({ scrollTop: 0, scrollHeight: 5000, clientHeight: 500 })).toBe(4000);
  });
});
