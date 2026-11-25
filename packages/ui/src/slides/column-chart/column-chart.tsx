import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { span } from "@/slides/lib/grid";
import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

export type ColumnChartProps = {
  /** Three to twelve columns in their natural order (months, weeks, steps). `step` lets a column appear at that step of the slide, its value, bar and label together; the baseline and the scale stay those of all columns. */
  items?: Array<{
    label: ReactNode;
    value: number;
    display?: ReactNode;
    highlight?: boolean;
    strong?: boolean;
    step?: number;
  }>;
  /** Instead of `items`: two to four groups of two or three columns each, for two series read against each other (before and after, small and large). Every group has the same columns in the same order; the group's name stands under it. `step` on a group lets its name and its columns appear at that step, on a baseline that is there from the start; `step` on a column inside lets it appear on its own, never before its group. */
  groups?: Array<{
    label: ReactNode;
    step?: number;
    items: Array<{
      label: ReactNode;
      value: number;
      display?: ReactNode;
      highlight?: boolean;
      strong?: boolean;
      step?: number;
    }>;
  }>;
  /** The value of a full-height column. The largest value by default. */
  max?: number;
  /** Height of the plot in px, 400 by default. */
  height?: number;
  /** Width of the block in px. Twelve columns by default. */
  width?: number;
};

type Column = NonNullable<ColumnChartProps["items"]>[number];

/**
 * What stays free above a full-height column, in px: its value at 32px, the 12px between value
 * and column, and 12px of air under the plot's top edge.
 */
const HEADROOM = 56;

type PlotProps = {
  /** The `data-slot` of the list, where it is the chart's root. */
  slot?: string;
  /** The columns of this run, in their order. */
  items: Column[];
  /** The value of a full-height column. */
  top: number;
  /** Height of the plot in px. */
  height: number;
  /** Space between two columns in px. */
  gap: number;
  /** Width of the list in px, where it is the chart's root. */
  width?: number;
  /** The step of the group the run stands in: no column of it appears before. */
  from?: number;
};

/**
 * One run of columns on its baseline. A list, so that a column is read as its label and its
 * value without the picture: every `<li>` holds the label, the value and the bar.
 *
 * The list is one grid of three rows (the plot, the 2px baseline, the labels) and every `<li>`
 * a subgrid across them, which keeps a label under its column although the baseline between
 * them runs through the gaps as well. The baseline is the list's own `::before`, in the second
 * row. A column's step marks its `<li>`, so a column not shown yet hides its value and label with
 * it, while the baseline, which belongs to the list, stays.
 */
function Plot({ slot, items, top, height, gap, width, from }: PlotProps) {
  const room = height - HEADROOM;
  return (
    <ol
      data-slot={slot}
      className="grid before:col-span-full before:row-start-2 before:bg-rule"
      style={{
        width,
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gridTemplateRows: `${height}px 2px auto`,
        columnGap: gap,
      }}
    >
      {items.map((item, index) => {
        // The later of the group's step and the column's own.
        const step = stepAttributes(maxStep([{ step: from }, { step: item.step }]));
        return (
          <li
            key={index}
            className="row-[1/4] grid grid-rows-subgrid"
            {...step}
            style={{ ...step.style, gridColumn: index + 1 }}
          >
            <p className="row-start-3 pt-4 text-slide-meta text-fg-muted">{item.label}</p>
            <div className="row-start-1 flex flex-col gap-3 self-end">
              <p
                className={cn(
                  "text-slide-body leading-none tabular-nums",
                  item.highlight ? "font-semibold text-accent" : "font-normal text-fg",
                )}
              >
                {item.display ?? item.value}
              </p>
              <div
                className={cn(item.highlight ? "bg-accent" : item.strong ? "bg-fg" : "bg-line")}
                style={{
                  // A scale of zero has no shares: every column is then the 2px stub.
                  height: Math.max(2, Math.round((top > 0 ? item.value / top : 0) * room)),
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Columns on a baseline, each with its value above and its label below.
 *
 * For an ordered scale, usually time, or with `groups` for two series compared in a few
 * categories. For a ranking use `BarList`. In groups the series differ by tone, never by hue:
 * the first is `line`, the second takes `strong` (the text colour), and one column may take the
 * accent instead; the label under each column names its series, so there is no legend. The 2px
 * rule is the baseline at zero; there is no y-axis and no gridline, because every column carries
 * its value. One column may take the accent. Lines, areas and pies are not part of the kit: a
 * line chart is drawn as an inline `<svg>` with a 2px `text` stroke, one `accent` series at
 * most, and labels set as `<p>` over it. A chart is compared as a whole, so its columns stand
 * together; reveal a column or a group only when the talk builds up to it (the month after the
 * relaunch, the second series).
 */
export function ColumnChart({
  items,
  groups,
  max,
  height = 400,
  width = span(12),
}: ColumnChartProps) {
  const columns = groups ? groups.flatMap((group) => group.items) : (items ?? []);
  const top = max ?? Math.max(...columns.map((column) => column.value));
  if (!groups) {
    return (
      <Plot
        slot="slide-column-chart"
        items={columns}
        top={top}
        height={height}
        gap={columns.length > 6 ? 32 : 64}
        width={width}
      />
    );
  }
  return (
    <ul
      data-slot="slide-column-chart"
      className="grid gap-16"
      style={{ width, gridTemplateColumns: `repeat(${groups.length}, 1fr)` }}
    >
      {groups.map((group, index) => (
        // The group's name is read before its columns and stands under them.
        // A group's step marks its name and its columns, not the item: its baseline stays.
        <li key={index} className="flex flex-col-reverse justify-end">
          <p
            className="pt-4 text-slide-body leading-[1.3] font-semibold text-fg"
            {...stepAttributes(group.step)}
          >
            {group.label}
          </p>
          <Plot items={group.items} top={top} height={height} gap={24} from={group.step} />
        </li>
      ))}
    </ul>
  );
}

/** The highest `step` among the columns, and with `groups` among the groups and their columns. */
ColumnChart.slideSteps = ((props) =>
  Math.max(
    maxStep(props.items),
    maxStep(props.groups),
    ...(props.groups ?? []).map((group) => maxStep(group.items)),
  )) satisfies StepCounter<ColumnChartProps>;
