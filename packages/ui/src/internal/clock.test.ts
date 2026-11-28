import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** A page that is visible and can be listened to, as far as the clock asks. */
function fakePage() {
  vi.stubGlobal("document", {
    visibilityState: "visible",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

describe("the shared clock", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-27T12:00:00Z"));
    fakePage();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reads the present for the first listener, not the moment it was loaded", async () => {
    const { readClock, subscribeClock } = await import("./clock");
    // The page was rendered on the server and read the clock there long ago, or never.
    vi.setSystemTime(new Date("2026-11-27T12:05:00Z"));
    const stop = subscribeClock(() => {});
    // What React reads right after subscribing, before any tick.
    expect(readClock()).toBe(Date.parse("2026-11-27T12:05:00Z"));
    stop();
  });

  it("gives every reader the same moment between two ticks", async () => {
    const { readClock, subscribeClock } = await import("./clock");
    const stop = subscribeClock(() => {});
    const first = readClock();
    vi.advanceTimersByTime(5_000);
    expect(readClock()).toBe(first);
    stop();
  });

  it("ticks every quarter of a minute and tells its listeners", async () => {
    const { readClock, subscribeClock } = await import("./clock");
    const heard = vi.fn();
    const stop = subscribeClock(heard);
    const first = readClock();
    vi.advanceTimersByTime(15_000);
    expect(heard).toHaveBeenCalledTimes(1);
    expect(readClock()).toBe(first + 15_000);
    stop();
  });
});
