"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { AxisLabels, AxisLines, useAxisTicks } from "@/internal/chart/axis";
import { axisGrid, axisSizer, useAxisColumn } from "@/internal/chart/axis-column";
import { chartFormat } from "@/internal/chart/format";
import { labelAlong, lane, laneAt } from "@/internal/chart/lane";
import { ChartLegend, type LegendItem } from "@/internal/chart/legend";
import { type Shape, useMorph } from "@/internal/chart/morph";
import { areaPath, type Curve, linePath, type MaybePoint, SIZE } from "@/internal/chart/path";
import { Readout, type ReadoutRow } from "@/internal/chart/readout";
import { extent, nearest, share, valueAxis } from "@/internal/chart/scale";
import {
  inferInterval,
  pointLabel,
  tickLabel,
  type TimeInterval,
  timeTicks,
  type TimeValue,
  toTime,
} from "@/internal/chart/time";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

export type TimeSeriesChartSeries<Row> = {
  /** The field of a row that holds this series' value. A missing value is a gap. */
  key: keyof Row & string;
  /** Its name, in the legend, the readout and the table. */
  label: string;
  /**
   * `comparison` is context, not news: the same measure for the period before. It is drawn in
   * the de-emphasis grey, under the others and without an area.
   */
  kind?: "comparison";
};

export type TimeSeriesChartActive<Row> = { index: number; row: Row };

export type TimeSeriesChartProps<Row> = Omit<ComponentProps<"figure">, "children" | "onChange"> & {
  /** One row per moment, oldest first (they are sorted if not). */
  data: readonly Row[];
  /** The field that holds the moment: a `Date`, an ISO string or milliseconds. */
  x: keyof Row & string;
  series: readonly TimeSeriesChartSeries<Row>[];
  /** What the chart shows, in a few words: its accessible name and the caption of its table. */
  label: string;
  /** `area` washes the room under a single line; with several series it stays `line`. */
  variant?: "line" | "area";
  /**
   * The wash of an `area`: `fade` thins out towards the baseline (the default, Justin
   * 2026-11-20), `flat` is even.
   */
  wash?: "fade" | "flat";
  /**
   * What finds the moment under the pointer. `line`, a hairline, for a dense series of days or
   * hours; `band`, a soft band as wide as one point's step, where a point stands for a stretch
   * of time (a month, a week) and the whole stretch is meant.
   */
  crosshair?: "line" | "band";
  /**
   * Whether the lines draw themselves in, left to right, where the chart first shows (the
   * default, Justin 2026-11-20). Changes after that re-form the lines instead. Off under
   * reduced motion.
   */
  drawIn?: boolean;
  /** `smooth` bends through the points without overshooting them; `linear` joins them straight. */
  curve?: Curve;
  /**
   * The colour of a single series. `neutral`, the text colour, measures (as a `Meter` does);
   * `accent` is Indigo, for the one chart a view is about. Several series take the series
   * colours in their fixed order.
   */
  tone?: "neutral" | "accent";
  /** How values are written, as `Intl.NumberFormat` options: `{ style: "currency", currency: "EUR" }`. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** What one point stands for. Read from the data when left out. */
  interval?: TimeInterval;
  /** The height of the plot in px; the axes come on top. */
  height?: number;
  /** Whether zero must stand on the value axis. Default: yes, so sizes are told truthfully. */
  zero?: boolean;
  /** A level to reach or stay under, drawn as a quiet line with its name. */
  target?: { value: number; label: string };
  /** The last point is still being counted (today, this month): its stretch is dashed. */
  incomplete?: boolean;
  /** Whether a readout follows the pointer. Leave it on unless the figure above shows the value. */
  readout?: boolean;
  /** Told when the point under the pointer or the keyboard changes, and `null` when it leaves. */
  onActiveChange?: (active: TimeSeriesChartActive<Row> | null) => void;
  /** Data is being fetched again: the chart keeps its picture, quieter, until it arrives. */
  pending?: boolean;
  /** What stands in the plot without any data. */
  empty?: ReactNode;
  /**
   * The chart's own words, for one chart worded without a `LocaleProvider`: what assistive
   * tech calls the plot (`chart`), how its keyboard is explained after the name (`hint`) and
   * the head of the table's first column (`time`). Each one left out is the provider's.
   */
  words?: Partial<TimeSeriesChartWords>;
};

/** The words a `TimeSeriesChart` says on its own (`words`). */
export type TimeSeriesChartWords = { chart: string; hint: string; time: string };

type Scrub = { index: number; shown: boolean; entry: number; touch: boolean; keyboard: boolean };

const value = (row: unknown, key: string): number | null => {
  const raw = (row as Record<string, unknown>)[key];
  if (raw === null || raw === undefined || raw === "") return null;
  const number = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(number) ? number : null;
};

/**
 * Values over time: revenue by day, requests by hour, sign-ups by month. A line per series,
 * a crosshair that finds the nearest moment wherever the pointer is in the plot, and one readout
 * with every series' value there. It is read, so it is flat; only the point under the hand
 * moves.
 *
 * Put it on a `Card` under a `CardBar`, with the headline figure above it (a `Stat`); the chart
 * shows how the figure came about. Up to six series; more is a table. A single series needs no
 * legend: say in the heading what it is.
 *
 * Keyboard: the plot is one stop; the arrows walk the points, Home and End jump, Escape leaves,
 * and each point is said aloud. A visually hidden table carries every value as well.
 */
export function TimeSeriesChart<Row>({
  data,
  x,
  series,
  label,
  variant = "line",
  wash = "fade",
  crosshair = "line",
  drawIn = true,
  curve = "smooth",
  tone = "neutral",
  format,
  locale,
  interval: intervalProp,
  height = 240,
  zero = true,
  target,
  incomplete = false,
  readout = true,
  onActiveChange,
  pending = false,
  empty,
  words: wordsProp,
  className,
  style,
  ...props
}: TimeSeriesChartProps<Row>) {
  const { messages, tag } = useLocale();
  const words: TimeSeriesChartWords = {
    chart: messages.charts.chart,
    hint: messages.charts.hintValues,
    time: messages.charts.time,
    ...wordsProp,
  };
  // An id that may stand in `url(#…)`.
  const id = `chart${useId().replace(/[^\w-]/g, "")}`;
  const live = useLive();
  const { grid: axisGridRef, sizer: axisSizerRef } = useAxisColumn<
    HTMLDivElement,
    HTMLDivElement
  >();
  const svg = useRef<SVGSVGElement>(null);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [scrub, setScrub] = useState<Scrub | null>(null);
  const [said, setSaid] = useState("");
  const numbers = chartFormat(locale ?? tag, format);

  const rows = useMemo(
    () =>
      data
        .map((row) => ({ row, time: toTime(row[x] as TimeValue) }))
        .filter((entry) => Number.isFinite(entry.time))
        .sort((a, b) => a.time - b.time),
    [data, x],
  );
  const times = useMemo(() => rows.map((entry) => entry.time), [rows]);
  const interval = intervalProp ?? inferInterval(times);
  const start = times[0] ?? 0;
  const end = times.at(-1) ?? 0;
  const xs = useMemo(
    () => times.map((time) => (end > start ? (time - start) / (end - start) : 0.5)),
    [times, start, end],
  );

  // Colours follow the series, not their place among those shown: hiding one repaints nothing.
  const main = series.filter((entry) => entry.kind !== "comparison");
  const colorOf = (entry: TimeSeriesChartSeries<Row>) => {
    if (entry.kind === "comparison") return "var(--lf-series-muted)";
    if (main.length === 1) return tone === "accent" ? "var(--lf-series-1)" : "var(--lf-text)";
    return `var(--lf-series-${Math.min(main.indexOf(entry), 5) + 1})`;
  };
  const shown = series.filter((entry) => !hidden.has(entry.key));
  // Comparison first, so the news is drawn over the context.
  const drawn = [...shown].sort(
    (a, b) => Number(b.kind === "comparison") - Number(a.kind === "comparison"),
  );
  const area = variant === "area" && main.length === 1;

  const axis = useMemo(() => {
    const values: (number | null)[] = [];
    for (const entry of shown) for (const { row } of rows) values.push(value(row, entry.key));
    if (target) values.push(target.value);
    return valueAxis(extent(values), { zero: zero || area, count: height < 160 ? 3 : 4 });
    // `shown` is derived from `series` and `hidden`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, series, hidden, target, zero, area, height]);
  const up = (number: number) => share(number, axis.domain);
  const valueTicks = useAxisTicks(axis.ticks, axis.domain);
  const base = 1 - Math.min(1, Math.max(0, up(0)));

  const shapes = useMemo<Shape[]>(
    () =>
      drawn.map((entry) => ({
        key: entry.key,
        curve,
        base,
        points: rows.map(({ row }, index): MaybePoint => {
          const number = value(row, entry.key);
          return number === null ? null : { x: xs[index]!, y: 1 - up(number) };
        }),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, xs, series, hidden, axis, curve],
  );
  useMorph(svg, shapes);

  const ticks = useMemo(() => timeTicks(start, end, { interval }), [start, end, interval]);
  const withYear = rows.length > 0 && new Date(start).getFullYear() !== new Date(end).getFullYear();

  // --- the point under the pointer ------------------------------------------------------------

  const active = scrub && rows[scrub.index] ? scrub : null;
  const activeIndex = active?.shown ? active.index : null;

  const readoutRows = (index: number): ReadoutRow[] =>
    shown
      .filter((entry) => value(rows[index]!.row, entry.key) !== null)
      .map((entry) => ({
        key: entry.key,
        color: colorOf(entry),
        mark: "line",
        value: numbers.value(value(rows[index]!.row, entry.key)!),
        label: entry.label,
      }));
  const sentence = (index: number) =>
    `${pointLabel(times[index]!, interval, { locale: locale ?? tag, withYear })}: ${readoutRows(
      index,
    )
      .map((row) => `${row.label} ${row.value}`)
      .join(", ")}`;

  // The caller hears of a change of point, and of the readout going: from the event itself.
  const show = (index: number, how: { touch?: boolean; keyboard?: boolean } = {}) => {
    if (activeIndex !== index) onActiveChange?.({ index, row: rows[index]!.row });
    setScrub((old) => ({
      index,
      shown: true,
      // A readout that was gone comes back where it is wanted, not travelling from where it left.
      entry: old?.shown ? old.entry : (old?.entry ?? 0) + 1,
      touch: how.touch ?? false,
      keyboard: how.keyboard ?? false,
    }));
    if (how.keyboard) setSaid(sentence(index));
  };
  const hide = () => {
    if (activeIndex !== null) onActiveChange?.(null);
    setScrub((old) => (old?.shown ? { ...old, shown: false, touch: false } : old));
  };

  const indexAt = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return nearest(xs, box.width > 0 ? (event.clientX - box.left) / box.width : 0);
  };
  const finger = useRef<number | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" || rows.length === 0) return;
    // One finger owns the scrub until it lifts; a second one is ignored.
    if (finger.current !== null) return;
    finger.current = event.pointerId;
    show(indexAt(event), { touch: true });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (rows.length === 0) return;
    if (event.pointerType !== "mouse" && event.pointerId !== finger.current) return;
    const index = indexAt(event);
    if (scrub?.shown && scrub.index === index) return;
    show(index, { touch: event.pointerType !== "mouse" });
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
    if (rows.length === 0) return;
    const last = rows.length - 1;
    const from = scrub?.shown ? scrub.index : null;
    const to =
      event.key === "ArrowRight"
        ? from === null
          ? last
          : Math.min(last, from + 1)
        : event.key === "ArrowLeft"
          ? from === null
            ? last
            : Math.max(0, from - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : undefined;
    if (event.key === "Escape" && scrub?.shown) {
      event.preventDefault();
      hide();
      return;
    }
    if (to === undefined) return;
    event.preventDefault();
    show(to, { keyboard: true });
  };

  // --- drawing --------------------------------------------------------------------------------

  const legendItems: LegendItem[] = series.map((entry) => ({
    key: entry.key,
    label: entry.label,
    color: colorOf(entry),
    mark: "line",
    hidden: hidden.has(entry.key),
  }));
  const toggle = (key: string) =>
    setHidden((old) => {
      const next = new Set(old);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const lastSplit = incomplete && rows.length >= 2 ? xs[rows.length - 2]! : null;
  const activeX = active ? xs[active.index]! : 0;
  const step = rows.length > 1 ? 1 / (rows.length - 1) : 1;

  return (
    <figure
      data-slot="time-series-chart"
      aria-label={label}
      aria-busy={pending || undefined}
      className={cn("flex min-w-0 flex-col gap-4", className)}
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
        {rows.length > 0 && (
          <AxisLabels ticks={valueTicks} locale={locale ?? tag} format={format} />
        )}

        <div
          data-slot="time-series-chart-plot"
          data-live={live || undefined}
          data-scrubbing={active?.shown && active.touch ? "touch" : undefined}
          role="group"
          aria-roledescription={words.chart}
          aria-label={`${label}. ${words.hint}`}
          tabIndex={rows.length > 0 ? 0 : undefined}
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
          {/* The lines of the value axis: hairlines, zero below the axis a step stronger. */}
          {rows.length > 0 && (
            <AxisLines
              ticks={valueTicks}
              line={(value) => (value === 0 && axis.domain[0] < 0 ? "bg-line" : "bg-hairline")}
            />
          )}

          {rows.length === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-fg-muted">
              {empty === undefined ? messages.charts.empty : empty}
            </p>
          ) : (
            <svg
              ref={svg}
              aria-hidden
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              preserveAspectRatio="none"
              className={cn(
                "absolute inset-0 size-full overflow-visible transition-opacity spring-settle",
                pending && "opacity-45",
                drawIn && "chart-draw",
              )}
            >
              {lastSplit !== null && (
                <defs>
                  <clipPath id={`${id}-done`}>
                    <rect x={-SIZE} y={-SIZE} width={SIZE + lastSplit * SIZE} height={3 * SIZE} />
                  </clipPath>
                  <clipPath id={`${id}-open`}>
                    <rect x={lastSplit * SIZE} y={-SIZE} width={2 * SIZE} height={3 * SIZE} />
                  </clipPath>
                </defs>
              )}
              {drawn.map((entry, order) => {
                const shape = shapes[order]!;
                const color = colorOf(entry);
                const line = {
                  "data-series": entry.key,
                  "data-shape": "line",
                  fill: "none",
                  strokeWidth: 2,
                  strokeLinejoin: "round",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                } as const;
                return (
                  <g
                    key={entry.key}
                    className="transition-opacity spring-settle in-data-live:starting:opacity-0"
                    style={{ "--series": color } as CSSProperties}
                  >
                    {area && entry.kind !== "comparison" && (
                      <>
                        <linearGradient
                          id={`${id}-${entry.key}-wash`}
                          gradientUnits="userSpaceOnUse"
                          x1={0}
                          x2={0}
                          y1={0}
                          y2={SIZE}
                        >
                          <stop
                            offset={0}
                            style={{
                              stopColor: "var(--series)",
                              stopOpacity: wash === "fade" ? 0.2 : 0.1,
                            }}
                          />
                          <stop
                            offset={1}
                            style={{
                              stopColor: "var(--series)",
                              stopOpacity: wash === "fade" ? 0.01 : 0.1,
                            }}
                          />
                        </linearGradient>
                        <path
                          data-series={entry.key}
                          data-shape="area"
                          d={morphless(shape, "area")}
                          style={{ fill: `url(#${`${id}-${entry.key}-wash`})` }}
                        />
                      </>
                    )}
                    <path
                      {...line}
                      d={morphless(shape, "line")}
                      clipPath={lastSplit !== null ? `url(#${`${id}-done`})` : undefined}
                      style={{ stroke: color }}
                    />
                    {lastSplit !== null && (
                      <path
                        {...line}
                        d={morphless(shape, "line")}
                        strokeDasharray="1 5"
                        clipPath={`url(#${`${id}-open`})`}
                        style={{ stroke: color }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {target && rows.length > 0 && (
            <div
              aria-hidden
              className={cn(lane, "transition-[translate] spring-settle")}
              style={laneAt(undefined, up(target.value))}
            >
              <div className="absolute inset-x-0 bottom-0 h-px translate-y-1/2 bg-fg-muted/60" />
              <span className="absolute right-0 bottom-1.5 text-xs leading-none whitespace-nowrap text-fg-muted">
                {target.label}
              </span>
            </div>
          )}

          {active && (
            <div
              key={active.entry}
              aria-hidden
              data-shown={active.shown || undefined}
              className={cn(
                lane,
                "opacity-0 transition-opacity spring-leave data-shown:opacity-100 data-shown:spring-snap data-shown:starting:opacity-0",
              )}
            >
              {crosshair === "band" ? (
                <div className={cn(lane, "chart-follow")} style={laneAt(activeX)}>
                  <div
                    className="absolute inset-y-0 right-0 translate-x-1/2 rounded-sm bg-hover"
                    style={{ width: `${Math.max(step * 100, 0.5)}%` }}
                  />
                </div>
              ) : (
                <div className={cn(lane, "chart-follow")} style={laneAt(activeX)}>
                  <div className="absolute inset-y-0 right-0 w-px translate-x-1/2 bg-line" />
                </div>
              )}
              {shown.map((entry) => {
                const number = value(rows[active.index]!.row, entry.key);
                if (number === null) return null;
                return (
                  <div
                    key={entry.key}
                    className={cn(lane, "chart-follow")}
                    style={laneAt(activeX, up(number))}
                  >
                    {/* A flat dot with a ring of the ground, so it stays clear where it
                        crosses another line (Justin, 2026-11-20). */}
                    <span
                      className="absolute right-0 bottom-0 size-2.5 translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-ground in-data-[slot=card]:ring-surface"
                      style={{ backgroundColor: colorOf(entry) }}
                    />
                  </div>
                );
              })}
              {readout && (
                <div className={cn(lane, "chart-follow")} style={laneAt(activeX)}>
                  <Readout
                    title={pointLabel(times[active.index]!, interval, {
                      locale: locale ?? tag,
                      withYear,
                    })}
                    rows={readoutRows(active.index)}
                    className={cn(
                      "absolute top-0 right-0 transition-[translate] spring-settle",
                      activeX > 0.5 ? "-translate-x-3" : "translate-x-[calc(100%+0.75rem)]",
                    )}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* The marks of time: the coarser ones stay as the chart narrows (`chart-ticks`). */}
        <div
          aria-hidden
          className="chart-ticks relative col-start-2 row-start-2 h-3 text-xs leading-none text-fg-muted"
        >
          {ticks.map((tick) => {
            const at = end > start ? (tick.time - start) / (end - start) : 0.5;
            return (
              <div key={tick.time} data-level={tick.level} className={lane} style={laneAt(at)}>
                <span
                  className="absolute top-0 right-0 whitespace-nowrap tabular-nums"
                  style={labelAlong(at)}
                >
                  {tickLabel(tick, locale ?? tag)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hidden by a box around it: `sr-only` on the table itself clips the table's box, and
          Safari draws a caption outside that box, so the caption showed over the plot. */}
      {rows.length > 0 && (
        <div className="sr-only">
          <table>
            <caption>{label}</caption>
            <thead>
              <tr>
                <th scope="col">{words.time}</th>
                {series.map((entry) => (
                  <th key={entry.key} scope="col">
                    {entry.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, time }) => (
                <tr key={time}>
                  <th scope="row">
                    {pointLabel(time, interval, { locale: locale ?? tag, withYear: true })}
                  </th>
                  {series.map((entry) => {
                    const number = value(row, entry.key);
                    return <td key={entry.key}>{number === null ? "–" : numbers.value(number)}</td>;
                  })}
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

/** The path React renders: the final shape. `useMorph` moves it there when it changes. */
function morphless(shape: Shape, kind: "line" | "area") {
  return kind === "area"
    ? areaPath(shape.points, shape.base, shape.curve)
    : linePath(shape.points, shape.curve);
}
