import type { ReactNode } from "react";

import { span } from "@/slides/lib/grid";

export type BodyProps = {
  /** Measure in px. Six columns (800) by default, which keeps lines near 55 characters. */
  width?: number;
  /** A short paragraph. Use <b> for the one thing that must not be missed. */
  children: ReactNode;
};

/**
 * Body copy at 32px on a measure of six columns.
 *
 * A slide is not a page: three lines of body copy are plenty. Longer text belongs in a document.
 */
export function Body({ width, children }: BodyProps) {
  return (
    <p
      data-slot="slide-body"
      className="text-slide-body text-fg-body"
      style={{ width: width ?? span(6) }}
    >
      {children}
    </p>
  );
}
