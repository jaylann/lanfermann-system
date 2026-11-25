import type { ReactNode } from "react";

import { spans } from "@/slides/lib/grid";
import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

export type KeyValueProps = {
  /** Pairs of term and description. Five rows at most. An optional third entry is the step the row appears at, with its line (`["Vergleich", "Drei Betriebe aus Ihrer Nähe.", 1]`); without it the row is there from the start. */
  items: Array<[ReactNode, ReactNode, number?]>;
  /** Grid columns of the term, 4 by default. */
  termSpan?: number;
  /** Grid columns of the whole block, 12 by default; the columns of the side inside a Split. */
  total?: number;
};

/**
 * Rows of term and description under one rule.
 *
 * For what a thing consists of: the scope of an offer, the facts of a project, the conditions.
 * The term is two or three words, the description one sentence. Rows can come one by one when
 * each is explained in turn; a scope the reader should take in at once stands whole.
 */
export function KeyValue({ items, termSpan = 4, total = 12 }: KeyValueProps) {
  return (
    <dl data-slot="slide-key-value" className="flex flex-col">
      {items.map(([term, description, at], index) => {
        const step = stepAttributes(at);
        return (
          <div
            key={index}
            className="grid items-baseline gap-16 border-t border-line py-6 first:border-t-2 first:border-rule"
            {...step}
            style={{ ...step.style, gridTemplateColumns: spans([termSpan, total - termSpan]) }}
          >
            <dt className="text-slide-body leading-[1.3] font-semibold text-fg">{term}</dt>
            <dd className="text-slide-body text-fg-body">{description}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/** The highest step among the rows (the third entry of each). */
KeyValue.slideSteps = ((props) =>
  maxStep(props.items.map(([, , step]) => ({ step })))) satisfies StepCounter<KeyValueProps>;
