import type { ReactNode } from "react";

import { ColumnItems } from "@/slides/columns/column-items";
import type { IconGlyph } from "@/slides/icon/icons";
import { maxStep, type StepCounter } from "@/slides/step/steps";

export type StepsProps = {
  /** Steps in order. `icon` sets one of `ICONS` before the title. `when` replaces the default label "Schritt n": a week, a date, a duration. `more` is one block under the text: the `Code` of a command. The blocks of all steps start on one line; give them the same number of lines so they end on one too. `step` is the click of the slide at which this one appears, with its rule and its `more` block; without it the step is there from the start. */
  items: Array<{
    title: ReactNode;
    text?: ReactNode;
    when?: ReactNode;
    icon?: IconGlyph;
    more?: ReactNode;
    step?: number;
  }>;
};

/**
 * Two to five steps in order, each with when it happens.
 *
 * Only for a real sequence: the order must matter. The label says when („Woche 1“, „bis 15.12.“)
 * or counts the step. With five steps keep each text to one sentence. A process can be told as it
 * happens: give the steps one click each (`step`), in their order.
 */
export function Steps({ items }: StepsProps) {
  return (
    <ColumnItems
      slot="slide-steps"
      items={items}
      labelOf={(item, index) => item.when ?? `Schritt ${index + 1}`}
    />
  );
}

/** The highest click among the steps (the item field `step`, not the steps of this part). */
Steps.slideSteps = ((props) => maxStep(props.items)) satisfies StepCounter<StepsProps>;
