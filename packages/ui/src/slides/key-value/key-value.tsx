import type { ReactNode } from "react";

import { spans } from "@/slides/lib/grid";

export type KeyValueProps = {
  /** Pairs of term and description. Five rows at most. */
  items: Array<[ReactNode, ReactNode]>;
  /** Grid columns of the term, 4 by default. */
  termSpan?: number;
  /** Grid columns of the whole block, 12 by default; the columns of the side inside a Split. */
  total?: number;
};

/**
 * Rows of term and description under one rule.
 *
 * For what a thing consists of: the scope of an offer, the facts of a project, the conditions.
 * The term is two or three words, the description one sentence.
 */
export function KeyValue({ items, termSpan = 4, total = 12 }: KeyValueProps) {
  return (
    <dl data-slot="slide-key-value" className="flex flex-col">
      {items.map(([term, description], index) => (
        <div
          key={index}
          className="grid items-baseline gap-16 border-t border-line py-6 first:border-t-2 first:border-rule"
          style={{ gridTemplateColumns: spans([termSpan, total - termSpan]) }}
        >
          <dt className="text-slide-body leading-[1.3] font-semibold text-fg">{term}</dt>
          <dd className="text-slide-body text-fg-body">{description}</dd>
        </div>
      ))}
    </dl>
  );
}
