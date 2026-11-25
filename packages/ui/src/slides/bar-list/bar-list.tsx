import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { span } from "@/slides/lib/grid";
import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

/** The column the written values stand in, in px. */
const VALUE_WIDTH = 160;
/** The two 32px gaps of a row: label, bar, value. */
const ROW_GAPS = 64;

export type BarListProps = {
  /** Up to seven rows, sorted by value. `display` is the value as written, with its unit. `step` lets a row appear at that step of the slide, its label, bar and value together; the scale stays that of all rows, so no bar changes when another appears. */
  items: Array<{
    label: ReactNode;
    value: number;
    display?: ReactNode;
    highlight?: boolean;
    step?: number;
  }>;
  /** The value of a full-width bar. The largest value by default. */
  max?: number;
  /** Width of the block in px. Twelve columns by default; pass the column width inside a Split. */
  width?: number;
  /** Grid columns the labels take, 4 by default. */
  labelSpan?: number;
};

/**
 * Ranked horizontal bars with the value written at the end of each row.
 *
 * The default chart: most comparisons are a ranking, and a ranking reads fastest as bars with
 * their values written out. Bars are `line`, the one bar the title talks about is `accent`. No
 * axis, no gridlines, no legend: the value stands at the end of its row. Sort by value unless the
 * order is itself the message. Bars start at zero, always. A ranking is compared as a whole, so
 * its rows stand together; reveal a row only when the talk builds up to it (the accent bar last).
 */
export function BarList({ items, max, width = span(12), labelSpan = 4 }: BarListProps) {
  const labelWidth = span(labelSpan);
  const track = width - labelWidth - VALUE_WIDTH - ROW_GAPS;
  const full = max ?? Math.max(...items.map((item) => item.value));
  // A ranking is a list: every row names its bar and writes its value, so nothing is read from
  // the bar's length alone.
  return (
    <ol
      data-slot="slide-bar-list"
      className="flex flex-col border-t-2 border-rule pt-2"
      style={{ width }}
    >
      {items.map((item, index) => {
        const step = stepAttributes(item.step);
        return (
          <li
            key={index}
            className="grid items-center gap-8 py-4"
            {...step}
            style={{
              ...step.style,
              gridTemplateColumns: `${labelWidth}px ${track}px ${VALUE_WIDTH}px`,
            }}
          >
            <p className="text-slide-body text-fg">{item.label}</p>
            <div className="flex">
              <div
                className={cn("h-8", item.highlight ? "bg-accent" : "bg-line")}
                style={{
                  // A scale of zero has no shares: every bar is then the 2px stub.
                  width: Math.max(2, Math.round((full > 0 ? item.value / full : 0) * track)),
                }}
              />
            </div>
            <p
              className={cn(
                "text-right text-slide-body tabular-nums",
                item.highlight ? "font-semibold text-accent" : "font-normal text-fg",
              )}
            >
              {item.display ?? item.value}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** The highest `step` among the rows. */
BarList.slideSteps = ((props) => maxStep(props.items)) satisfies StepCounter<BarListProps>;
