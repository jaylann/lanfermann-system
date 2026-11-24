"use client";

import { useMemo, useSyncExternalStore } from "react";

/** How React reads a media query: whether it matches now, and a way to hear when that changes. */
export type MediaQueryStore = {
  subscribe: (notify: () => void) => () => void;
  getSnapshot: () => boolean;
};

/** The store behind `useMediaQuery`, for one query. */
export function mediaQueryStore(query: string): MediaQueryStore {
  return {
    subscribe(notify) {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    getSnapshot: () => window.matchMedia(query).matches,
  };
}

/**
 * Whether a CSS media query matches, such as `"(min-width: 48rem)"` or
 * `"(prefers-reduced-motion: reduce)"`. The component renders again whenever the answer changes.
 *
 * A server cannot know the window, so there, and in the browser while a server's page hydrates,
 * the answer is `serverValue` (false unless given). Pick the value that makes the server's page
 * right for most people; the browser renders again with the real answer once it has hydrated. Where only the look differs, a Tailwind variant
 * (`md:`, `motion-reduce:`) is better: CSS knows the answer before the first paint.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const store = useMemo(() => mediaQueryStore(query), [query]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => serverValue);
}
