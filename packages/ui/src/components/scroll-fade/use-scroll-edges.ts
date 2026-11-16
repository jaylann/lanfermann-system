"use client";

import { type RefObject, useEffect } from "react";

/**
 * Says on a box that scrolls which of its ends has more to show: `data-overflow` holds `start`,
 * `end`, both, or is absent. The stylesheet fades those edges (scroll-fade.css) once the box
 * also carries `data-scroll-fade="x"` or `"y"`. The state is written straight onto the element,
 * so scrolling never renders.
 *
 * Use it where the scrolling box is another part's element and cannot be a `ScrollFade` (a list
 * of tabs, the popup of a menu). `axis` is the direction the box scrolls in. For a box that
 * mounts later than the component (a popup), pass something that changes when it does as
 * `mounted`, so the edges are watched from then on.
 */
export function useScrollEdges(
  ref: RefObject<HTMLElement | null>,
  axis: "x" | "y" = "x",
  mounted?: unknown,
) {
  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Read from the right, a box counts its way back in negative numbers: its start is still
      // where nothing has been scrolled past.
      const start = Math.abs(axis === "x" ? scroller.scrollLeft : scroller.scrollTop);
      const visible = axis === "x" ? scroller.clientWidth : scroller.clientHeight;
      const total = axis === "x" ? scroller.scrollWidth : scroller.scrollHeight;
      const overflow = [start > 1 ? "start" : "", start + visible < total - 1 ? "end" : ""]
        .filter(Boolean)
        .join(" ");
      if (overflow) scroller.dataset.overflow = overflow;
      else delete scroller.dataset.overflow;
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener("scroll", schedule, { passive: true });
    // The box, and what it holds: the overflow changes when either changes its size.
    const observer = new ResizeObserver(schedule);
    observer.observe(scroller);
    for (const child of scroller.children) observer.observe(child);
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, [ref, axis, mounted]);
}
