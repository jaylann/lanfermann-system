import type { ReactNode } from "react";

export type TakeawayProps = {
  /** One sentence, one line. */
  children: ReactNode;
};

/**
 * A 48px conclusion under the 2px rule, at the foot of a slide.
 *
 * For slides whose evidence needs reading (a wide table, a chart): the title names the finding,
 * the takeaway says what follows from it. Not on every slide, and never a repeat of the title.
 */
export function Takeaway({ children }: TakeawayProps) {
  return (
    <p
      data-slot="slide-takeaway"
      data-lines={1}
      className="border-t-2 border-rule pt-6 text-slide-lead text-fg"
    >
      {children}
    </p>
  );
}
