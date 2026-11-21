"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * The column of a chart's value axis, as wide as its widest label. A new range changes the
 * labels („150.000 €“ becomes „80.000 €“); the column then eases to its new width and the plot
 * beside it with it, instead of the whole chart jumping sideways (Justin, 2026-11-21).
 *
 * The labels' sizer is measured and its width written to `--axis-width` on the grid. Until it
 * has been measured (on the server, in the first frame) the column is `auto`, which is the same
 * width, so nothing moves when the measure arrives; only later changes ease. It is the one
 * layout property a chart animates: the plot has to make room, as a panel's height pushes the
 * content below it, and it happens once per change of data, never under a finger.
 */
export function useAxisColumn<Grid extends HTMLElement, Sizer extends HTMLElement>() {
  const grid = useRef<Grid>(null);
  const sizer = useRef<Sizer>(null);
  useLayoutEffect(() => {
    const box = grid.current;
    const labels = sizer.current;
    if (!box || !labels) return;
    const fit = () => box.style.setProperty("--axis-width", `${labels.offsetWidth}px`);
    fit();
    const frame = requestAnimationFrame(() => (box.dataset.sized = ""));
    const watch = new ResizeObserver(fit);
    watch.observe(labels);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
    };
  }, []);
  return { grid, sizer };
}

/** The chart's grid: the axis column at its measured width, easing on `settle` once measured. */
export const axisGrid =
  "grid-cols-[var(--axis-width,auto)_minmax(0,1fr)] data-sized:transition-[grid-template-columns] data-sized:spring-settle motion-reduce:transition-none";

/** The labels' sizer: as wide as its widest label, whatever the column's width is. */
export const axisSizer = "w-max justify-self-end";
