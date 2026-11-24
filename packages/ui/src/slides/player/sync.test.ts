import { describe, expect, it } from "vitest";

import { channelName, isNewer, isRemoteIntent, parseMessage } from "./sync";

describe("messages between the two windows", () => {
  it("takes a numbered message once: the second copy and a late one are dropped", () => {
    expect(isNewer(7, null)).toBe(true);
    expect(isNewer(8, 7)).toBe(true);
    expect(isNewer(7, 7)).toBe(false);
    expect(isNewer(6, 7)).toBe(false);
  });

  it("applies a run of states in order whatever way they arrive", () => {
    // Each state is sent on two ways; the channel's copies arrive late and out of order.
    const arrivals = [3, 3, 4, 2, 5, 4, 5];
    let last: number | null = null;
    const applied: number[] = [];
    for (const seq of arrivals) {
      if (!isNewer(seq, last)) continue;
      last = seq;
      applied.push(seq);
    }
    expect(applied).toEqual([3, 4, 5]);
  });

  it("reads the three shapes of its own session", () => {
    expect(parseMessage({ lfSlides: "a1", type: "hello" }, "a1")).toEqual({ type: "hello" });
    expect(
      parseMessage({ lfSlides: "a1", type: "state", seq: 4, index: 2, blackout: true }, "a1"),
    ).toEqual({ type: "state", seq: 4, index: 2, blackout: true });
    expect(parseMessage({ lfSlides: "a1", type: "intent", seq: 9, intent: "next" }, "a1")).toEqual({
      type: "intent",
      seq: 9,
      intent: "next",
    });
  });

  it("drops what belongs to another session or to another script", () => {
    expect(parseMessage({ lfSlides: "b2", type: "hello" }, "a1")).toBeUndefined();
    expect(parseMessage({ type: "hello" }, "a1")).toBeUndefined();
    expect(parseMessage("hello", "a1")).toBeUndefined();
    expect(parseMessage(null, "a1")).toBeUndefined();
    expect(parseMessage({ lfSlides: "a1", type: "reload" }, "a1")).toBeUndefined();
  });

  it("drops a message whose fields are not what they must be", () => {
    const state = { lfSlides: "a1", type: "state", seq: 4, index: 2, blackout: false };
    expect(parseMessage({ ...state, seq: "4" }, "a1")).toBeUndefined();
    expect(parseMessage({ ...state, index: -1 }, "a1")).toBeUndefined();
    expect(parseMessage({ ...state, index: 1.5 }, "a1")).toBeUndefined();
    expect(parseMessage({ ...state, blackout: "yes" }, "a1")).toBeUndefined();
    const intent = { lfSlides: "a1", type: "intent", seq: 1, intent: "next" };
    expect(parseMessage({ ...intent, seq: undefined }, "a1")).toBeUndefined();
    // The grid and the full screen are a window's own; a second window cannot ask for them.
    expect(parseMessage({ ...intent, intent: "grid" }, "a1")).toBeUndefined();
    expect(parseMessage({ ...intent, intent: "fullscreen" }, "a1")).toBeUndefined();
  });

  it("knows which intents cross to the presenter", () => {
    for (const intent of ["next", "previous", "first", "last", "blackout", "escape"]) {
      expect(isRemoteIntent(intent)).toBe(true);
    }
    expect(isRemoteIntent("grid")).toBe(false);
    expect(isRemoteIntent(3)).toBe(false);
  });

  it("names a session's channel", () => {
    expect(channelName("a1")).toBe("lf-slides:a1");
  });
});
