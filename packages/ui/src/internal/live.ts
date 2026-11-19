"use client";

import { useEffect, useState } from "react";

/**
 * Whether a part has stood on screen for a frame. Page load does not animate: what is there
 * when a part first shows stands still, and only what changes afterwards moves. Put the result
 * on the part as `data-live` and gate an entrance with `in-data-live:starting:*`.
 */
export function useLive(): boolean {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return live;
}
