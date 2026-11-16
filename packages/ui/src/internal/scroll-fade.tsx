"use client";

import { type ComponentProps, useRef } from "react";

import { useScrollEdges } from "@/internal/scroll-edges";
import { mergeRefs } from "@/lib/merge-refs";

export type ScrollFadeProps = ComponentProps<"div"> & {
  /** The direction the box scrolls in, and so the edges that fade. */
  axis?: "x" | "y";
};

/**
 * A box that scrolls and fades its edges where more waits (scroll-fade.css), as a code block's
 * long lines and a long row of tabs do. The box itself still needs its `overflow-*`.
 *
 * It is the client part of components that stay server-safe (`Table`, `DocsLayout`): they render
 * this one box, and everything inside it stays theirs. The mask also cuts what is drawn outside
 * the box, so a focus outline belongs on a box around it.
 */
export function ScrollFade({ axis = "x", ref, ...props }: ScrollFadeProps) {
  const box = useRef<HTMLDivElement>(null);
  useScrollEdges(box, axis);
  return <div ref={mergeRefs(box, ref)} data-scroll-fade={axis} {...props} />;
}
