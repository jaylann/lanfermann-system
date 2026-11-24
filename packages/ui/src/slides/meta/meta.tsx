import type { ReactNode } from "react";

export type MetaProps = {
  /** Measure in px. */
  width?: number;
  /** A label, a note, a method line. */
  children: ReactNode;
};

/**
 * 24px secondary text in sentence case: a label, a note, a method line.
 *
 * Sentence case, no capitals, no tracking, no mono. A label names what stands under it („Vorher“,
 * „E-Mail“); it never numbers or categorises the slide.
 */
export function Meta({ width, children }: MetaProps) {
  return (
    <p data-slot="slide-meta" className="text-slide-meta text-fg-muted" style={{ width }}>
      {children}
    </p>
  );
}
