"use client";

import { useMediaQuery } from "@/lib/use-media-query";

/**
 * Whether the person asked for less motion. False on the server.
 *
 * CSS answers that question for transitions (`motion-reduce:`). This is for motion a component
 * starts by itself, on a timer, which no stylesheet can switch off.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
