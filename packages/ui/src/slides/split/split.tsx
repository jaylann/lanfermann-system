import type { ReactNode } from "react";

import { spans } from "@/slides/lib/grid";

export type SplitProps = {
  /** Columns taken by the left and the right side. They always add up to twelve. */
  ratio?: "4|8" | "5|7" | "6|6" | "7|5" | "8|4";
  /** Vertical alignment of the two sides. `end` (default) lets both stand on the same bottom line. */
  align?: "start" | "end" | "stretch";
  /** Exactly two blocks. */
  children: ReactNode;
};

/**
 * Two columns on the grid: evidence beside its reading.
 *
 * The wide side takes the evidence (a frame, a chart, a table), the narrow side its reading
 * (findings, a figure, a short list). Column widths in px: 4 = 512, 5 = 656, 6 = 800, 7 = 944,
 * 8 = 1088.
 */
export function Split({ ratio = "7|5", align = "end", children }: SplitProps) {
  return (
    <div
      data-slot="slide-split"
      className="grid gap-16"
      style={{ gridTemplateColumns: spans(ratio.split("|").map(Number)), alignItems: align }}
    >
      {children}
    </div>
  );
}
