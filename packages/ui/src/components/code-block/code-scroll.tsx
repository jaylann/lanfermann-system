"use client";

import { type ReactNode, type RefObject, useRef } from "react";

import { useScrollEdges } from "@/components/scroll-fade/use-scroll-edges";
import { cn } from "@/lib/cn";

type CodeScrollProps = {
  /** The name of the code: a screen reader announces it when the code takes focus. */
  label: string;
  /** The `<code>` element, for the copy button to select when the clipboard is refused. */
  codeRef?: RefObject<HTMLPreElement | null>;
  className?: string;
  /** Classes for the `<pre>`: its padding. */
  preClassName?: string;
  children: ReactNode;
};

/**
 * The code's own scrolling region. A long line scrolls inside the block, never the page, and
 * the region takes keyboard focus so it can be scrolled without a pointer. Its edges fade where
 * more code waits (`useScrollEdges`).
 */
export function CodeScroll({ label, codeRef, className, preClassName, children }: CodeScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollEdges(ref);

  return (
    <div
      ref={ref}
      data-slot="code-block-scroll"
      data-scroll-fade="x"
      // A group, not a region: a page of documentation holds many blocks, and landmarks there
      // would crowd the outline (and need names that differ).
      role="group"
      aria-label={label}
      // Scrollable by keyboard; the block draws the outline, since the edge mask would cut it.
      tabIndex={0}
      className={cn("min-w-0 overflow-x-auto focus-visible:outline-hidden", className)}
    >
      <pre ref={codeRef} className={cn("m-0 w-full font-mono", preClassName)}>
        {children}
      </pre>
    </div>
  );
}
