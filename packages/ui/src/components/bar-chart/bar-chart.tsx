"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react";

import { AxisLabels, AxisLines, useAxisTicks } from "@/internal/chart/axis";
import { axisGrid, axisSizer, useAxisColumn } from "@/internal/chart/axis-column";
import { chartFormat } from "@/internal/chart/format";
import { lane, laneAt } from "@/internal/chart/lane";
import { ChartLegend, type LegendItem } from "@/internal/chart/legend";
import { Readout, type ReadoutRow } from "@/internal/chart/readout";
import { bands, extent, share, valueAxis } from "@/internal/chart/scale";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

export type BarChartSeries<Row> = {
  /** The field of a row that holds this series' value. */
  key: keyof Row & string;
  label: string;
};

export type BarChartActive<Row> = { index: number; row: Row };

export type BarChartProps<Row> = Omit<ComponentProps<"figure">, "children"> & {
  /** One row per category, in the order they stand. */
  data: readonly Row[];
  /** The field that names a row's category. */
  x: keyof Row & string;
  series: readonly BarChartSeries<Row>[];
  /** What the chart shows, in a few words: its accessible name and its table's caption. */
  label: string;
  /** How a category is written under its bars; its field as text when left out. */
  categoryLabel?: (row: Row) => string;
  /** Several series side by side (`grouped`) or on each other as parts of a whole (`stacked`). */
  layout?: "grouped" | "stacked";
  /** The colour of a single series: the text colour, or Indigo for the one chart a view is about. */
  tone?: "neutral" | "accent";
  /** How values are written, as `Intl.NumberFormat` options. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** The height of the plot in px. */
  height?: number;
  /** Whether a readout names the values of the category under the pointer. */
  readout?: boolean;
  onActiveChange?: (active: BarChartActive<Row> | null) => void;
  /** Whether the bars rise out of their baseline where the chart first shows. */
  drawIn?: boolean;
  /** Data is being fetched again: the chart keeps its picture, quieter. */
  pending?: boolean;
  /** What stands in the plot without any data. */
  empty?: ReactNode;
  /**
   * The chart's own words, for one chart worded without a `LocaleProvider`: what assistive
   * tech calls the plot (`chart`), how its keyboard is explained after the name (`hint`), the
   * sum of a stack in the readout (`total`) and the head of the table's first column
   * (`category`). Each one left out is the provider's.
   */
  words?: Partial<BarChartWords>;
};

/** The words a `BarChart` says on its own (`words`). */
export type BarChartWords = { chart: string; hint: string; total: string; category: string };

const value = (row: unknown, key: string): number => {
  const raw = (row as Record<string, unknown>)[key];
  const number = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(number) ? number : 0;
};

/**
 * Amounts by category: revenue by month, quotes by state, hours by person. A column per
 * category and series, all from one baseline, so they compare by height. With several series
 * the columns stand side by side (`grouped`), or on each other where they are parts of one
 * whole (`stacked`, positive amounts only), divided by a 2px gap of the ground.
 *
 * For things ranked by one amount use a `BarList`; for a measure that runs over time, a
 * `TimeSeriesChart`. Keyboard: the plot is one stop, the arrows walk the categories.
 */
export function BarChart<Row>({
  data,
  x,
  series,
  label,
  categoryLabel,
  layout = "grouped",
  tone = "neutral",
  format,
  locale,
  height = 240,
  readout = true,
  onActiveChange,
  drawIn = true,
  pending = false,
  empty,
  words: wordsProp,
  className,
  style,
  ...props
}: BarChartProps<Row>) {
  const { messages, tag } = useLocale();
  const words: BarChartWords = {
    chart: messages.charts.chart,
    hint: messages.charts.hintValues,
    total: messages.charts.total,
    category: messages.charts.category,
    ...wordsProp,
  };
  const live = useLive();
  const { grid: axisGridRef, sizer: axisSizerRef } = useAxisColumn<
    HTMLDivElement,
    HTMLDivElement
  >();
  const numbers = chartFormat(locale ?? tag, format);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [active, setActive] = useState<{
    index: number;
    shown: boolean;
    entry: number;
    /** The way the reader went to it, for the readout's swap. */
    way: 1 | -1;
  } | null>(null);
  const [said, setSaid] = useState("");
  const finger = useRef<number | null>(null);

  const shown = series.filter((entry) => !hidden.has(entry.key));
  const stacked = layout === "stacked" && shown.length > 1;
  const colorOf = (entry: BarChartSeries<Row>) =>
    series.length === 1
      ? tone === "accent"
        ? "var(--lf-series-1)"
        : "var(--lf-text)"
      : `var(--lf-series-${Math.min(series.indexOf(entry), 5) + 1})`;
  const nameOf = (row: Row) => {
    if (categoryLabel) return categoryLabel(row);
    const raw = (row as Record<string, unknown>)[x];
    return typeof raw === "string" || typeof raw === "number" ? String(raw) : "";
  };

  const axis = useMemo(() => {
    const values: number[] = [];
    for (const row of data) {
      if (stacked)
        values.push(shown.reduce((sum, entry) => sum + Math.max(0, value(row, entry.key)), 0));
      else for (const entry of shown) values.push(value(row, entry.key));
    }
    return valueAxis(extent(values), { zero: true, count: height < 160 ? 3 : 4 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, series, hidden, stacked, height]);
  const up = (number: number) => share(number, axis.domain);
  const ticks = useAxisTicks(axis.ticks, axis.domain);
  const zero = up(0);
  const slots = bands(data.length, data.length > 16 ? 0.25 : 0.35);

  // --- the category under the pointer ---------------------------------------------------------

  const current = active && data[active.index] ? active : null;
  const activeIndex = current?.shown ? current.index : null;

  const rowsOf = (index: number): ReadoutRow[] => {
    const row = data[index]!;
    const rows: ReadoutRow[] = shown.map((entry) => ({
      key: entry.key,
      color: colorOf(entry),
      mark: "swatch",
      value: numbers.value(value(row, entry.key)),
      label: entry.label,
    }));
    if (stacked) {
      rows.push({
        key: "__summe",
        color: "transparent",
        mark: "swatch",
        value: numbers.value(shown.reduce((sum, entry) => sum + value(row, entry.key), 0)),
        label: words.total,
      });
    }
    return rows;
  };

  const show = (index: number, keyboard = false) => {
    if (activeIndex !== index) onActiveChange?.({ index, row: data[index]! });
    setActive((old) => ({
      index,
      shown: true,
      entry: old?.shown ? old.entry : (old?.entry ?? 0) + 1,
      way: old?.shown && index < old.index ? -1 : 1,
    }));
    if (keyboard) {
      setSaid(
        `${nameOf(data[index]!)}: ${rowsOf(index)
          .map((row) => `${row.label} ${row.value}`)
          .join(", ")}`,
      );
    }
  };
  const hide = () => {
    if (activeIndex !== null) onActiveChange?.(null);
    setActive((old) => (old?.shown ? { ...old, shown: false } : old));
  };
  const indexAt = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const at = box.width > 0 ? (event.clientX - box.left) / box.width : 0;
    return Math.min(data.length - 1, Math.max(0, Math.floor(at * data.length)));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" || data.length === 0 || finger.current !== null) return;
    finger.current = event.pointerId;
    show(indexAt(event));
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (data.length === 0) return;
    if (event.pointerType !== "mouse" && event.pointerId !== finger.current) return;
    const index = indexAt(event);
    if (activeIndex !== index) show(index);
  };
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") {
      if (event.type === "pointerleave") hide();
      return;
    }
    if (event.pointerId !== finger.current) return;
    finger.current = null;
    hide();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (data.length === 0) return;
    const last = data.length - 1;
    const from = activeIndex;
    const keys: Record<string, number> = {
      ArrowRight: from === null ? 0 : Math.min(last, from + 1),
      ArrowLeft: from === null ? last : Math.max(0, from - 1),
      Home: 0,
      End: last,
    };
    if (event.key === "Escape" && activeIndex !== null) {
      event.preventDefault();
      hide();
      return;
    }
    const to = keys[event.key];
    if (to === undefined) return;
    event.preventDefault();
    show(to, true);
  };

  const legendItems: LegendItem[] = series.map((entry) => ({
    key: entry.key,
    label: entry.label,
    color: colorOf(entry),
    mark: "swatch",
    hidden: hidden.has(entry.key),
  }));
  const toggle = (key: string) =>
    setHidden((old) => {
      const next = new Set(old);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // A bar is a column as tall as its region (above or below zero), pushed out of it by
  // `translate` so only its value's share shows: it rises and falls without being laid out.
  const column = (
    entry: BarChartSeries<Row>,
    amount: number,
    { top, order, gap, queue }: { top: boolean; order: number; gap: boolean; queue: number },
  ) => {
    const negative = amount < 0;
    const reach = negative
      ? axis.domain[0] < 0
        ? amount / axis.domain[0]
        : 0
      : axis.domain[1] > 0
        ? amount / axis.domain[1]
        : 0;
    return (
      <span
        key={entry.key}
        aria-hidden
        className={cn(
          "absolute inset-0 block transition-[translate] spring-glide motion-reduce:transition-none",
          negative ? "rounded-b-xs" : top && "rounded-t-xs",
          drawIn && !negative && "chart-rise",
          // Parts of a stack are divided by a gap of the ground, not an outline.
          gap && "shadow-[0_-2px_0_0_var(--chart-gap)]",
        )}
        style={
          {
            backgroundColor: colorOf(entry),
            translate: `0 ${(negative ? -1 : 1) * (1 - Math.min(1, reach)) * 100}%`,
            zIndex: order,
            "--chart-grow-index": queue,
          } as CSSProperties
        }
      />
    );
  };

  return (
    <figure
      data-slot="bar-chart"
      aria-label={label}
      aria-busy={pending || undefined}
      className={cn(
        "flex min-w-0 flex-col gap-4 [--chart-gap:var(--lf-ground)] in-data-[slot=card]:[--chart-gap:var(--lf-surface)]",
        className,
      )}
      style={{ ...style, "--chart-height": `${height}px` } as CSSProperties}
      {...props}
    >
      {series.length > 1 && <ChartLegend items={legendItems} onToggle={toggle} />}

      <div
        ref={axisGridRef}
        className={cn("relative grid grid-rows-[auto_auto] gap-x-3 gap-y-2", axisGrid)}
      >
        {/* The axis' column is as wide as its widest label: every label once, unseen. */}
        <div
          ref={axisSizerRef}
          aria-hidden
          className={cn(
            "invisible col-start-1 row-start-1 grid h-(--chart-height) text-xs tabular-nums",
            axisSizer,
          )}
        >
          {axis.ticks.map((tick) => (
            <span key={tick} className="col-start-1 row-start-1">
              {numbers.axis(tick)}
            </span>
          ))}
        </div>
        {data.length > 0 && <AxisLabels ticks={ticks} locale={locale ?? tag} format={format} />}

        <div
          data-slot="bar-chart-plot"
          data-live={live || undefined}
          role="group"
          aria-roledescription={words.chart}
          aria-label={`${label}. ${words.hint}`}
          tabIndex={data.length > 0 ? 0 : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onPointerLeave={onPointerEnd}
          onKeyDown={onKeyDown}
          onBlur={hide}
          className={cn(
            "relative col-start-2 row-start-1 h-(--chart-height) touch-pan-y select-none",
            "rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
          )}
        >
          {data.length > 0 && (
            <AxisLines
              ticks={ticks}
              line={(value) => (value === 0 ? "bg-line/50" : "bg-hairline")}
            />
          )}

          {data.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-fg-muted">
              {empty === undefined ? messages.charts.empty : empty}
            </p>
          )}

          {/* The category under the pointer: a soft band behind its columns. */}
          {current && (
            <div
              key={current.entry}
              aria-hidden
              data-shown={current.shown || undefined}
              className="absolute inset-y-0 rounded-sm bg-hover opacity-0 transition-opacity spring-leave data-shown:opacity-100 data-shown:spring-snap data-shown:starting:opacity-0"
              style={{
                left: `${(current.index / data.length) * 100}%`,
                width: `${100 / data.length}%`,
              }}
            />
          )}

          <div
            className={cn(
              "absolute inset-0 transition-opacity spring-settle",
              pending && "opacity-45",
            )}
          >
            {data.map((row, index) => {
              const slot = slots[index]!;
              return (
                <div
                  key={index}
                  className="absolute inset-y-0 flex justify-center gap-0.5"
                  style={{ left: `${slot.start * 100}%`, width: `${slot.width * 100}%` }}
                >
                  {(stacked ? [null] : shown).map((entry, place) => (
                    <div
                      key={entry?.key ?? "stack"}
                      className="relative h-full max-w-6 min-w-0 flex-1"
                    >
                      {/* Above zero, and below it: each a region its columns are clipped to. */}
                      <div
                        className="absolute inset-x-0 top-0 overflow-hidden"
                        style={{ bottom: `${zero * 100}%` }}
                      >
                        {entry
                          ? value(row, entry.key) >= 0 &&
                            column(entry, value(row, entry.key), {
                              top: true,
                              order: 1,
                              gap: false,
                              queue: index * Math.max(1, shown.length) + place,
                            })
                          : (() => {
                              // A stack: the top of each part is the sum up to it. The highest
                              // part is drawn first and the lower ones in front of it.
                              let sum = 0;
                              const parts = shown.map((part) => {
                                sum += Math.max(0, value(row, part.key));
                                return { part, sum };
                              });
                              return parts.map(({ part, sum: top }, step) =>
                                column(part, top, {
                                  top: step === parts.length - 1,
                                  order: parts.length - step,
                                  // Every part with another above it opens a gap at its top.
                                  gap: step < parts.length - 1,
                                  queue: index,
                                }),
                              );
                            })()}
                      </div>
                      {zero > 0 && entry && value(row, entry.key) < 0 && (
                        <div
                          className="absolute inset-x-0 bottom-0 overflow-hidden"
                          style={{ top: `${(1 - zero) * 100}%` }}
                        >
                          {column(entry, value(row, entry.key), {
                            top: false,
                            order: 1,
                            gap: false,
                            queue: index,
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {readout && current && (
            <div
              key={`readout-${current.entry}`}
              aria-hidden
              data-shown={current.shown || undefined}
              className={cn(
                lane,
                // Above the columns, which carry a stacking order of their own (a stack's parts).
                "z-10 opacity-0 transition-opacity spring-leave data-shown:opacity-100 data-shown:spring-snap data-shown:starting:opacity-0",
              )}
            >
              {/* Beside the band: after it in the left half, before it in the right. */}
              <div
                className={cn(lane, "chart-follow")}
                style={laneAt(
                  (current.index + 0.5) / data.length > 0.5
                    ? current.index / data.length
                    : (current.index + 1) / data.length,
                )}
              >
                <Readout
                  title={nameOf(data[current.index]!)}
                  rows={rowsOf(current.index)}
                  swap={current.index}
                  way={current.way}
                  className={cn(
                    "absolute top-0 right-0",
                    (current.index + 0.5) / data.length > 0.5
                      ? "-translate-x-2"
                      : "translate-x-[calc(100%+0.5rem)]",
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* The names of the categories, centred under their columns; the finer ones go first
            where the chart narrows. */}
        <div
          aria-hidden
          className="chart-ticks relative col-start-2 row-start-2 h-3 text-xs leading-none text-fg-muted"
        >
          {data.map((row, index) => {
            const level = index % 4 === 0 ? 0 : index % 2 === 0 ? 1 : 2;
            return (
              <div
                key={index}
                data-level={data.length <= 6 ? 0 : level}
                className={lane}
                style={laneAt((index + 0.5) / data.length)}
              >
                <span className="absolute top-0 right-0 translate-x-1/2 whitespace-nowrap">
                  {nameOf(row)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {data.length > 0 && (
        // Hidden by a box around it: Safari draws a table's caption outside a hidden table.
        <div className="sr-only">
          <table>
            <caption>{label}</caption>
            <thead>
              <tr>
                <th scope="col">{words.category}</th>
                {series.map((entry) => (
                  <th key={entry.key} scope="col">
                    {entry.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  <th scope="row">{nameOf(row)}</th>
                  {series.map((entry) => (
                    <td key={entry.key}>{numbers.value(value(row, entry.key))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p aria-live="polite" className="sr-only">
        {said}
      </p>
    </figure>
  );
}
