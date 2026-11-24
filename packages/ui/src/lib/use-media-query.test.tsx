import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mediaQueryStore, useMediaQuery } from "./use-media-query";

/** A window whose media queries are answered from `matching`, and that can say they changed. */
function fakeWindow(matching: Set<string>) {
  const listeners = new Map<string, Set<() => void>>();
  const listenersOf = (query: string) => {
    const set = listeners.get(query) ?? new Set();
    listeners.set(query, set);
    return set;
  };
  const matchMedia = vi.fn((query: string) => ({
    get matches() {
      return matching.has(query);
    },
    addEventListener: (_type: "change", listener: () => void) => listenersOf(query).add(listener),
    removeEventListener: (_type: "change", listener: () => void) =>
      listenersOf(query).delete(listener),
  }));
  vi.stubGlobal("window", { matchMedia });
  return {
    matchMedia,
    /** Flips a query and tells everyone listening to it. */
    flip(query: string) {
      if (matching.has(query)) matching.delete(query);
      else matching.add(query);
      for (const listener of listenersOf(query)) listener();
    },
    listening: (query: string) => listenersOf(query).size,
  };
}

const WIDE = "(min-width: 48rem)";

afterEach(() => vi.unstubAllGlobals());

describe("mediaQueryStore", () => {
  it("answers whether the query matches now", () => {
    fakeWindow(new Set([WIDE]));
    expect(mediaQueryStore(WIDE).getSnapshot()).toBe(true);
    expect(mediaQueryStore("(pointer: coarse)").getSnapshot()).toBe(false);
  });

  it("tells its listener when the answer changes, and has the new answer then", () => {
    const media = fakeWindow(new Set());
    const store = mediaQueryStore(WIDE);
    const answers: boolean[] = [];
    store.subscribe(() => answers.push(store.getSnapshot()));

    media.flip(WIDE);
    media.flip(WIDE);
    expect(answers).toEqual([true, false]);
  });

  it("stops listening when it is unsubscribed", () => {
    const media = fakeWindow(new Set());
    const store = mediaQueryStore(WIDE);
    const notify = vi.fn();
    const unsubscribe = store.subscribe(notify);
    expect(media.listening(WIDE)).toBe(1);

    unsubscribe();
    media.flip(WIDE);
    expect(media.listening(WIDE)).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it("hears only its own query", () => {
    const media = fakeWindow(new Set());
    const notify = vi.fn();
    mediaQueryStore(WIDE).subscribe(notify);

    media.flip("(prefers-reduced-motion: reduce)");
    expect(notify).not.toHaveBeenCalled();
  });
});

describe("useMediaQuery on a server", () => {
  function Answer({ serverValue }: { serverValue?: boolean }) {
    return <output>{String(useMediaQuery(WIDE, serverValue))}</output>;
  }

  it("answers false without asking the window", () => {
    const { matchMedia } = fakeWindow(new Set([WIDE]));
    expect(renderToString(<Answer />)).toBe("<output>false</output>");
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it("answers the value it is given for the server", () => {
    const { matchMedia } = fakeWindow(new Set());
    expect(renderToString(<Answer serverValue />)).toBe("<output>true</output>");
    expect(matchMedia).not.toHaveBeenCalled();
  });
});
