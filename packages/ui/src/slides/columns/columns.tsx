import type { ReactNode } from "react";

import { ColumnItems } from "@/slides/columns/column-items";
import type { IconGlyph } from "@/slides/icon/icons";
import { maxStep, type StepCounter } from "@/slides/step/steps";

export type ColumnsProps = {
  /** Title and one or two sentences each. `icon` sets one of `ICONS` before the title. `label` is an optional line above the title (a place, a trade, a date). `more` is one block under the text, usually a `Code`. The blocks of all columns start on one line; give them the same number of lines so they end on one too. `step` is the step a column appears at, with its rule and its `more` block; without it the column is there from the start. */
  items: Array<{
    title: ReactNode;
    text?: ReactNode;
    label?: ReactNode;
    icon?: IconGlyph;
    more?: ReactNode;
    step?: number;
  }>;
};

/**
 * Two to four parallel items as columns under rules.
 *
 * For things of equal rank that have no order: services, audiences, principles. No numbers. An
 * icon, when the set has a fitting one for every item, stands small before the title, never above
 * it. If the items happen in sequence, use `Steps`. Bring the columns in one by one only when the
 * talk takes each in turn; when the point is that they belong together, they stand together.
 */
export function Columns({ items }: ColumnsProps) {
  return <ColumnItems slot="slide-columns" items={items} labelOf={(item) => item.label} />;
}

/** The highest `step` among the columns. */
Columns.slideSteps = ((props) => maxStep(props.items)) satisfies StepCounter<ColumnsProps>;
