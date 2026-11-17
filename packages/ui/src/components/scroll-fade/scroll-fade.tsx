"use client";

import { type ComponentProps, type CSSProperties, useRef } from "react";

import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";

import { useScrollEdges } from "./use-scroll-edges";

export type ScrollFadeProps = ComponentProps<"div"> & {
  /** The direction the box scrolls in, and so the edges that fade. */
  axis?: "x" | "y";
  /**
   * The edges that may fade: both (the default), or only the one where the content starts or
   * ends. A list under a heading that stays put needs no fade at its start.
   */
  edges?: "both" | "start" | "end";
  /** How deep the fade is, as a CSS length. 40px unless set. */
  size?: string;
};

/**
 * A box that scrolls inside itself and fades at the edge where more waits, instead of being cut
 * hard: a long list in a sheet, a row of chips, the side column of a page. An edge fades only
 * while there is something beyond it, so a box whose content fits looks like any other, and the
 * fade moves in and out on `settle`. It is a mask, not a tinted overlay: it works on every
 * ground and over a picture.
 *
 * Give the box its size (`max-h-64`, `h-full`); it sets its own `overflow`. Its background and
 * border belong on a box around it, since the mask fades everything the box paints, and so does
 * a focus outline. What takes the keyboard focus inside is scrolled clear of the fade. A box
 * that holds nothing focusable must be reachable itself: give it `tabIndex={0}`, a `role` and a
 * name, as a `Table` does.
 *
 * Where the scrolling element belongs to another part, use `useScrollEdges` on it and set
 * `data-scroll-fade` to the axis.
 */
export function ScrollFade({
  axis = "y",
  edges = "both",
  size,
  className,
  style,
  ref,
  ...props
}: ScrollFadeProps) {
  const box = useRef<HTMLDivElement>(null);
  useScrollEdges(box, axis);
  return (
    <div
      ref={mergeRefs(box, ref)}
      data-slot="scroll-fade"
      data-scroll-fade={axis}
      data-fade-edges={edges === "both" ? undefined : edges}
      className={cn(axis === "x" ? "overflow-x-auto" : "overflow-y-auto", className)}
      style={size ? ({ "--scroll-fade-size": size, ...style } as CSSProperties) : style}
      {...props}
    />
  );
}
