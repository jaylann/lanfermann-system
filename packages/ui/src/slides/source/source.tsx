import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type SourceProps = {
  /** Draw the 1px line above it. Use it when nothing ruled stands directly above (a figure, a chart). */
  line?: boolean;
  /** Measure in px. */
  width?: number;
  /** „Quelle: publisher, title year“ or the method in one sentence. */
  children: ReactNode;
};

/**
 * The source or method line that every claim carries.
 *
 * The kit's signature: no number and no finding without it. Two forms. A source: `Quelle:
 * BrightLocal, Local Consumer Review Survey 2024` (publisher, title, year, joined by commas). A
 * method: `Messung vom 28.10.2026, MacBook M2 Pro, je 20 Aufgaben`. It is the last flow block of
 * the slide, directly under the evidence, in muted text at 24px. A slide with no source line
 * makes no measurable claim.
 */
export function Source({ line = false, width, children }: SourceProps) {
  return (
    <p
      data-slot="slide-source"
      className={cn("text-slide-meta text-fg-muted", line && "border-t border-line pt-4")}
      style={{ width }}
    >
      {children}
    </p>
  );
}
