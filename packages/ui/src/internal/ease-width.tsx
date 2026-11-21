"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/cn";

/**
 * Content whose box eases to its new width when it changes, instead of jumping: the label of a
 * button that now says something else („Vorjahr zeigen“, then „Dieses Jahr zeigen“). The
 * content keeps its natural width and stays centred; while the box is narrower it is cut at both
 * sides, so a longer label is uncovered from the middle out. At rest the box is exactly the
 * content's width.
 *
 * The width is read from a `ResizeObserver`, which gives the size before any transform, so a
 * button pressed down to its press scale is not measured small. Until it has been read (on the
 * server, before the first paint) the box is `auto`, the same width; only later changes ease.
 * Like the `CopyPill`'s words it eases `width` on `glide`: a size change, once, never under a
 * finger, and without a bounce that would cut into the label.
 */
export function EaseWidth({ children, className }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const outer = box.current;
    const inner = content.current;
    if (!outer || !inner) return;
    const watch = new ResizeObserver(([entry]) => {
      const width = entry?.borderBoxSize[0]?.inlineSize ?? inner.offsetWidth;
      // The label and the 0.5rem the box reaches into the padding on either side.
      outer.style.setProperty("--ease-width", `calc(${width}px + 1rem)`);
    });
    watch.observe(inner);
    return () => watch.disconnect();
  }, []);
  return (
    <span
      ref={box}
      data-slot="ease-width"
      className={cn(
        "inline-flex w-[var(--ease-width,auto)] justify-center gap-[inherit] overflow-x-clip transition-[width] spring-glide motion-reduce:transition-none",
        // The box reaches 0.5rem into the padding on either side, and fades out there: at rest
        // the fade lies where nothing is drawn, while it is narrower than the label it softens
        // the cut instead of slicing letters.
        "-mx-2 [mask-image:linear-gradient(to_right,transparent,#000_0.5rem,#000_calc(100%-0.5rem),transparent)] px-2",
      )}
    >
      <span
        ref={content}
        className={cn(
          "inline-flex shrink-0 items-center gap-[inherit] whitespace-nowrap",
          className,
        )}
      >
        {children}
      </span>
    </span>
  );
}
