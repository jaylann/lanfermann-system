"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(notify: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

/**
 * Whether the person asked for less motion. False on the server.
 *
 * CSS answers that question for transitions (`motion-reduce:`). This is for motion a component
 * starts by itself, on a timer, which no stylesheet can switch off.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
