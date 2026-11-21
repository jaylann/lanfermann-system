"use client";

import { cn } from "@/lib/cn";

export type LegendItem = {
  key: string;
  label: string;
  /** The series colour, as a CSS value (`var(--lf-series-2)`). */
  color: string;
  /** A line for a line, a swatch for what is filled (a bar, an area alone). */
  mark: "line" | "swatch";
  hidden?: boolean;
};

/**
 * The names of a chart's series, each after a short line or a swatch in its colour: the one
 * place that says which colour is which, so no series is told by colour alone. With `onToggle`
 * each name is a key that hides its series and shows it again; the colour stays with the series,
 * and the last series shown cannot be hidden.
 *
 * Text stays in the text colours; the colour stands beside it.
 */
export function ChartLegend({
  items,
  onToggle,
  className,
}: {
  items: readonly LegendItem[];
  onToggle?: (key: string) => void;
  className?: string;
}) {
  const shown = items.filter((item) => !item.hidden).length;
  return (
    <ul
      data-slot="chart-legend"
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm", className)}
    >
      {items.map((item) => {
        const mark = (
          <span
            aria-hidden
            className={cn(
              "shrink-0 transition-[background-color,box-shadow] spring-settle",
              item.mark === "line" ? "h-0.5 w-3 rounded-full" : "size-2.5 rounded-[3px]",
              item.hidden && "bg-transparent! inset-ring inset-ring-line",
            )}
            style={{ backgroundColor: item.color }}
          />
        );
        return (
          <li key={item.key} className="flex">
            {onToggle ? (
              <button
                type="button"
                aria-pressed={!item.hidden}
                // The last one shown stays: a chart with nothing in it says nothing.
                aria-disabled={!item.hidden && shown === 1 ? true : undefined}
                onClick={() => {
                  if (!item.hidden && shown === 1) return;
                  onToggle(item.key);
                }}
                className={cn(
                  "touch-target relative inline-flex items-center gap-2 rounded-sm text-fg-body",
                  "transition-colors spring-snap hover:text-fg",
                  "aria-[pressed=false]:text-fg-muted aria-[pressed=false]:hover:text-fg-body",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                )}
              >
                {mark}
                {item.label}
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 text-fg-body">
                {mark}
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
