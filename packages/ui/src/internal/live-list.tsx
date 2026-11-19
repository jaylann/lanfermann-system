"use client";

import { type ComponentProps, useEffect, useRef, useState } from "react";

import { mergeRefs } from "@/lib/merge-refs";

/**
 * A list that says when it has stood on screen for a frame (`data-live`), so only what joins it
 * afterwards animates its entrance. The one piece of script a server-safe list (a `Timeline`)
 * needs: the list stays markup the server writes, and this part marks it.
 *
 * Hidden (`display: none`, a closed tab) it is not live again until a frame after it shows, so
 * a list that is revealed stands still like one that loads.
 */
export function LiveList({ ref, ...props }: ComponentProps<"ol">) {
  const list = useRef<HTMLOListElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const element = list.current;
    if (!element) return;
    let frame = 0;
    // A list is resized to nothing when it is hidden, and back when it shows.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      if (!element.checkVisibility()) {
        setLive(false);
        return;
      }
      frame = requestAnimationFrame(() => setLive(true));
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  return <ol ref={mergeRefs(list, ref)} data-live={live ? "" : undefined} {...props} />;
}
