import type { ReactNode } from "react";

import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

/** A row of a `List` that appears at a step of the slide. */
type ListRow = { text: ReactNode; step?: number };

export type ListProps = {
  /** One sentence per row. Open a row with <b>two or three words</b> when the rows need names. A row written as `{ text, step }` appears at that step of the slide, with its line; a row written plainly is there from the start. */
  items: Array<ReactNode | { text: ReactNode; step?: number }>;
};

/** Whether a row is written as `{ text, step }`. No element, array or text has a `text` key. */
function isListRow(item: ReactNode | ListRow): item is ListRow {
  return typeof item === "object" && item !== null && "text" in item;
}

/**
 * Up to five plain rows separated by hairlines.
 *
 * The kit's bullet list: rows and lines, no bullets, no numbers, no icons. Rows are parallel in
 * form (all sentences, or all noun phrases) and none runs past two lines. When the rows are steps
 * in time, use `Steps`; when each has a term, use `KeyValue`. Rows that build one argument can
 * come one by one; a list the room should scan at once stands whole.
 */
export function List({ items }: ListProps) {
  return (
    <ul data-slot="slide-list" className="flex flex-col">
      {items.map((item, index) => {
        const row: ListRow = isListRow(item) ? item : { text: item };
        return (
          <li
            key={index}
            data-lines={2}
            className="border-t border-line py-6 text-slide-body text-fg-body first:border-t-2 first:border-rule"
            {...stepAttributes(row.step)}
          >
            {row.text}
          </li>
        );
      })}
    </ul>
  );
}

/** The highest `step` among the rows written as `{ text, step }`. */
List.slideSteps = ((props) =>
  maxStep(
    props.items.map((item) => (isListRow(item) ? item : undefined)),
  )) satisfies StepCounter<ListProps>;
