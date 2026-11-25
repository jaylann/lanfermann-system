import type { ReactNode } from "react";

import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

export type ObjectionsProps = {
  /** The objection as the customer says it, in quotation marks, and a one-sentence answer. Three rows at most. `step` is the step a row appears at, objection and answer together with their line; without it the row is there from the start. */
  items: Array<{ quote: ReactNode; answer: ReactNode; step?: number }>;
};

/**
 * A customer's objections in their own words, each beside its answer.
 *
 * Someone else's voice, so the slide stands on Tint. The objection is set in italics inside
 * German quotation marks („ “); the answer in upright body text. Italic appears nowhere else in a
 * deck: it marks words that are not ours. Objections can come one at a time, so the room hears
 * each answer before it reads the next objection.
 */
export function Objections({ items }: ObjectionsProps) {
  return (
    <ul data-slot="slide-objections" className="flex flex-col">
      {items.map((item, index) => (
        <li
          key={index}
          className="grid grid-cols-[auto_auto] items-baseline justify-start gap-16 border-t border-line py-6 first:border-t-2 first:border-rule"
          {...stepAttributes(item.step)}
        >
          <p className="slide-span-5 text-slide-body text-fg italic">{item.quote}</p>
          <p className="slide-span-7 text-slide-body text-fg-body">{item.answer}</p>
        </li>
      ))}
    </ul>
  );
}

/** The highest `step` among the rows. */
Objections.slideSteps = ((props) => maxStep(props.items)) satisfies StepCounter<ObjectionsProps>;
