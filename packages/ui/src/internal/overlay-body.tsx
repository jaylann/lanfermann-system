"use client";

import { type ComponentProps, useRef } from "react";

import { useScrollEdges } from "@/components/scroll-fade/use-scroll-edges";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";

import { overlayBody } from "./overlay";

export type OverlayBodyProps = ComponentProps<"div"> & {
  /**
   * Fade the edge where more content waits, as every box that scrolls inside itself does. Only
   * for a body whose content must never be masked (a picture that fills it) is it `false`.
   */
  fade?: boolean;
};

/**
 * The scrolling body of a `Dialog` or `Drawer`. Its top and bottom fade while content lies
 * beyond them, so a line never stands cut in half under the title or above the keys; at rest,
 * and at either end, nothing is masked. `scroll-padding` (scroll-fade.css) keeps a field or key
 * that takes the focus clear of the fade.
 */
export function OverlayBody({ className, fade = true, ref, ...props }: OverlayBodyProps) {
  const box = useRef<HTMLDivElement>(null);
  useScrollEdges(box, "y", fade);
  return (
    <div
      ref={mergeRefs(box, ref)}
      data-scroll-fade={fade ? "y" : undefined}
      className={cn(overlayBody, className)}
      {...props}
    />
  );
}
