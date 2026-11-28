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
import { Readout, type ReadoutRow } from "@/internal/chart/readout";
import { bands, extent, share, valueAxis } from "@/internal/chart/scale";
import {
  signedFormat,
  type WaterfallBar,
  waterfallBars,
  type WaterfallStep,
} from "@/internal/chart/steps";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

export type { WaterfallStep };

/** The words a `Waterfall` says on its own (`words`). */
export type WaterfallWords = {
  change: string;
  running: string;
  total: string;
  chart: string;
  hint: string;
  step: string;
};

export type WaterfallProps = Omit<ComponentProps<"figure">, "children"> & {
  /** The steps in the order they add up; a `total` stands from zero and shows the sum so far. */
  data: readonly WaterfallStep[];
  /** What the chart shows, in a few words: its accessible name and its table's caption. */
  label: string;
  /** How amounts are written, as `Intl.NumberFormat` options. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** The height of the plot in px. */
  height?: number;
  /**
   * The colours of gains and losses. `status` (the default): a gain in the success colour, a
   * loss in the danger colour, since here a step does mean good or bad. `quiet`: a gain in the
   * text colour and a loss in the muted grey, for a page where status colours are spent. Either
   * way the sign is written under every step and in the readout, never told by colour alone.
   */
  colors?: "status" | "quiet";
  /** The colour of a total: the text colour, or Indigo for the one chart a view is about. */
  tone?: "neutral" | "accent";
  /** Whether a readout names the step under the pointer. */
  readout?: boolean;
  /** Whether the columns are uncovered from left to right where the chart first shows. */
  drawIn?: boolean;
  /**
   * The chart's own words, for one chart worded without a `LocaleProvider`. In the readout
   * and the table: what a step adds (`change`), the sum after it (`running`) and a total
   * (`total`). For assistive tech: what the plot is called (`chart`), how its keyboard is
   * explained after the name (`hint`) and the head of the table's first column (`step`). Each
   * one left out is the provider's.
   */
  words?: Partial<WaterfallWords>;
  /** Data is being fetched again: the chart keeps its picture, quieter. */
  pending?: boolean;
  /** What stands in the plot without any data. */
  empty?: ReactNode;
};

/**
 * How a result is built from gains and losses: revenue, less material, less outside work,
 * equals the result. Each step floats from the sum before it to the sum after it, a hairline
 * carries the sum from its edge to the edge of the next step (one staircase), and a total
 * stands from zero.
 *
 * Every step writes its change with its sign under its name („−14.800 €“); the colour of a gain
 * and a loss only repeats it. For amounts that do not add up to one result use a `BarChart`.
 * Keyboard: the plot is one stop, the arrows walk the steps.
 */
export function Waterfall({
  data,
  label,
  format,
  locale,
  height = 240,
  colors = "status",
  tone = "neutral",
  readout = true,
  drawIn = true,
  words: wordsProp,
  pending = false,
  empty,
  className,
  style,
  ...props
}: WaterfallProps) {
  const { messages, tag } = useLocale();
  const live = useLive();
  const { grid: axisGridRef, sizer: axisSizerRef } = useAxisColumn<
    HTMLDivElement,
    HTMLDivElement
  >();
  const numbers = chartFormat(locale ?? tag, format);
  const signed = signedFormat(locale ?? tag, format);
  const words: WaterfallWords = {
    change: messages.charts.change,
    running: messages.charts.running,
    total: messages.charts.total,
    chart: messages.charts.chart,
    hint: messages.charts.hintSteps,
    step: messages.charts.step,
    ...wordsProp,
  };
  const [active, setActive] = useState<{
    index: number;
    shown: boolean;
    entry: number;
    /** The way the reader went to it, for the readout's swap. */
    way: 1 | -1;
  } | null>(null);
  const [said, setSaid] = useState("");
  const finger = useRef<number | null>(null);

  const bars = useMemo(() => waterfallBars(data), [data]);
  const axis = useMemo(
    () =>
      valueAxis(extent(bars.flatMap((bar) => [bar.start, bar.end])), {
        zero: true,
        count: height < 160 ? 3 : 4,
      }),
    [bars, height],
  );
  const up = (number: number) => share(number, axis.domain);
  const ticks = useAxisTicks(axis.ticks, axis.domain);
  const slots = bands(bars.length, bars.length > 12 ? 0.25 : 0.35);
  const centre = (index: number) => (index + 0.5) / bars.length;
  // A column's side, from its centre: half the column, as wide as its band and at most 1.5rem.
  const side = (index: number) => `min(${pct(slots[index]!.width)}, 1.5rem) / 2`;
  // The join after a column lies on the side of the column it leads to, its edge on the sum: it
  // runs on in that column's edge and never stands proud of a top (Justin, 2026-11-21).
  const joinsBelow = (index: number) => {
    const next = bars[index + 1];
    return next !== undefined && Math.min(next.start, next.end) < bars[index]!.running;
  };

  const colorOf = (bar: WaterfallBar) => {
    if (bar.total) return tone === "accent" ? "var(--lf-series-1)" : "var(--lf-text)";
    if (colors === "quiet") return bar.change >= 0 ? "var(--lf-text)" : "var(--lf-series-muted)";
    return bar.change >= 0 ? "var(--lf-success-solid)" : "var(--lf-danger-solid)";
  };
  /** What stands under a step: its change with its sign, or a total's sum. */
  const amountOf = (bar: WaterfallBar) => (bar.total ? numbers.value(bar.end) : signed(bar.change));

  // --- the step under the pointer -------------------------------------------------------------

  const current = active && bars[active.index] ? active : null;
  const activeIndex = current?.shown ? current.index : null;

  const rowsOf = (index: number): ReadoutRow[] => {
    const bar = bars[index]!;
    if (bar.total) {
      return [
        {
          key: "total",
          color: colorOf(bar),
          mark: "swatch",
          value: numbers.value(bar.end),
          label: words.total,
        },
      ];
    }
    return [
      {
        key: "change",
        color: colorOf(bar),
        mark: "swatch",
        value: signed(bar.change),
        label: words.change,
      },
      {
        key: "running",
        color: "transparent",
        mark: "swatch",
        value: numbers.value(bar.running),
        label: words.running,
      },
    ];
  };
  const sentence = (index: number) =>
    `${data[index]!.name}: ${rowsOf(index)
      .map((row) => `${row.label} ${row.value}`)
      .join(", ")}`;

  const show = (index: number, keyboard = false) => {
    setActive((old) => ({
      index,
      shown: true,
      entry: old?.shown ? old.entry : (old?.entry ?? 0) + 1,
      way: old?.shown && index < old.index ? -1 : 1,
    }));
    if (keyboard) setSaid(sentence(index));
  };
  const hide = () => setActive((old) => (old?.shown ? { ...old, shown: false } : old));
  const indexAt = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const at = box.width > 0 ? (event.clientX - box.left) / box.width : 0;
    return Math.min(bars.length - 1, Math.max(0, Math.floor(at * bars.length)));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" || bars.length === 0 || finger.current !== null) return;
    finger.current = event.pointerId;
    show(indexAt(event));
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (bars.length === 0) return;
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
    if (bars.length === 0) return;
    const last = bars.length - 1;
    const keys: Record<string, number> = {
      ArrowRight: activeIndex === null ? 0 : Math.min(last, activeIndex + 1),
      ArrowLeft: activeIndex === null ? last : Math.max(0, activeIndex - 1),
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

  return (
    <figure
      data-slot="waterfall"
      aria-label={label}
      aria-busy={pending || undefined}
      className={cn("flex min-w-0 flex-col gap-4", className)}
      style={{ ...style, "--chart-height": `${height}px` } as CSSProperties}
      {...props}
    >
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
        {bars.length > 0 && <AxisLabels ticks={ticks} locale={locale ?? tag} format={format} />}

        <div
          data-slot="waterfall-plot"
          data-live={live || undefined}
          role="group"
          aria-roledescription={words.chart}
          aria-label={`${label}. ${words.hint}`}
          tabIndex={bars.length > 0 ? 0 : undefined}
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
          {bars.length > 0 && (
            <AxisLines
              ticks={ticks}
              line={(value) => (value === 0 ? "bg-line/50" : "bg-hairline")}
            />
          )}

          {bars.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-fg-muted">
              {empty === undefined ? messages.charts.empty : empty}
            </p>
          )}

          {/* The step under the pointer: a soft band behind its column. */}
          {current && (
            <div
              key={current.entry}
              aria-hidden
              data-shown={current.shown || undefined}
              className="absolute inset-y-0 rounded-sm bg-hover opacity-0 transition-opacity spring-leave data-shown:opacity-100 data-shown:spring-snap data-shown:starting:opacity-0"
              style={{
                left: `${(current.index / bars.length) * 100}%`,
                width: `${100 / bars.length}%`,
              }}
            />
          )}

          <div
            aria-hidden
            className={cn(
              "absolute inset-0 transition-opacity spring-settle",
              pending && "opacity-45",
              drawIn && "chart-draw",
            )}
          >
            {/* The running sum carried from the side of one column to the side of the next: a
                hairline that meets both at square corners, so the steps read as one staircase
                (Justin, 2026-11-21). */}
            {bars.slice(0, -1).map((bar, index) => (
              <div
                key={`join-${index}`}
                className={cn(lane, "transition-[translate] spring-glide")}
                style={laneAt(undefined, up(bar.running))}
              >
                <div
                  className={cn(
                    "absolute bottom-0 h-px bg-line/70",
                    joinsBelow(index) ? "translate-y-full" : "translate-y-0",
                  )}
                  style={{
                    left: `calc(${pct(centre(index))} + ${side(index)})`,
                    right: `calc(${pct(1 - centre(index + 1))} + ${side(index + 1)})`,
                  }}
                />
              </div>
            ))}

            {bars.map((bar, index) => {
              const slot = slots[index]!;
              const low = Math.min(bar.start, bar.end);
              const high = Math.max(bar.start, bar.end);
              // A column that stands on zero (the first gain, a total) is square there and round
              // at its other end, as every column of a bar chart. One that floats on the
              // running sum stands on nothing: it is round at both ends (Justin, 2026-11-21).
              const grounded =
                bar.total ||
                Math.min(bar.start, bar.end) === 0 ||
                Math.max(bar.start, bar.end) === 0;
              // Corners as top-left, top-right, bottom-right, bottom-left.
              const corners = !grounded
                ? [5, 5, 5, 5]
                : Math.max(bar.start, bar.end) > 0
                  ? [5, 5, 0, 0]
                  : [0, 0, 5, 5];
              // Where a join meets a side, that corner is square, so the two run into one.
              const before = index > 0 ? bars[index - 1]!.running : undefined;
              if (before === high) corners[0] = 0;
              else if (before === low) corners[3] = 0;
              const after = index < bars.length - 1;
              if (after && bar.running === high) corners[1] = 0;
              else if (after && bar.running === low) corners[2] = 0;
              const radius = corners.map((corner) => `${corner}px`).join(" ");
              // Where the line runs on past this column's end on the far side of the sum (a
              // column above it, the next one below), the column reaches the line's other edge,
              // so the line is flush with both columns and not offset from this one.
              const reachDown = after && joinsBelow(index) && bar.running === low;
              const reachUp = after && !joinsBelow(index) && bar.running === high;
              const cut = `inset(calc(${pct(1 - up(high))} - ${reachUp ? 1 : 0}px) 0 calc(${pct(up(low))} - ${reachDown ? 1 : 0}px) 0 round ${radius})`;
              return (
                <div
                  key={`${data[index]!.name}-${index}`}
                  className="absolute inset-y-0 flex justify-center"
                  style={{ left: `${slot.start * 100}%`, width: `${slot.width * 100}%` }}
                >
                  {/* The whole plot's height in the column's colour, cut down to the step by
                      `clip-path`: a change moves the cut, nothing is laid out again. */}
                  <span
                    className="relative block h-full max-w-6 min-w-0 flex-1 transition-[clip-path] spring-glide motion-reduce:transition-none"
                    style={{
                      backgroundColor: colorOf(bar),
                      clipPath: cut,
                    }}
                  />
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
                "z-10 opacity-0 transition-opacity spring-leave data-shown:opacity-100 data-shown:spring-snap data-shown:starting:opacity-0",
              )}
            >
              {/* Beside the band: after it in the left half, before it in the right. */}
              <div
                className={cn(lane, "chart-follow")}
                style={laneAt(
                  centre(current.index) > 0.5
                    ? current.index / bars.length
                    : (current.index + 1) / bars.length,
                )}
              >
                <Readout
                  title={data[current.index]!.name}
                  rows={rowsOf(current.index)}
                  swap={current.index}
                  way={current.way}
                  className={cn(
                    "absolute top-0 right-0",
                    centre(current.index) > 0.5
                      ? "-translate-x-2"
                      : "translate-x-[calc(100%+0.5rem)]",
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Under each column its name and its change with the sign, one column of the grid each,
            so they line up with the bands; a long name breaks rather than run into the next. */}
        <div
          aria-hidden
          className="col-start-2 row-start-2 grid text-center text-xs leading-tight"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, bars.length)}, minmax(0, 1fr))` }}
        >
          {bars.map((bar, index) => (
            <div
              key={`${data[index]!.name}-${index}`}
              className="flex min-w-0 flex-col gap-0.5 px-0.5"
            >
              {/* A name too long for its band is hyphenated by the language's rules
                  („Fremd-leistung“), not broken at any letter. */}
              <span
                lang={String(locale ?? tag).split("-")[0]}
                className="text-balance hyphens-auto text-fg-muted"
              >
                {data[index]!.name}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap tabular-nums",
                  bar.total ? "font-medium text-fg-body" : "text-fg-muted",
                )}
              >
                {amountOf(bar)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {bars.length > 0 && (
        // Hidden by a box around it: Safari draws a table's caption outside a hidden table.
        <div className="sr-only">
          <table>
            <caption>{label}</caption>
            <thead>
              <tr>
                <th scope="col">{words.step}</th>
                <th scope="col">{words.change}</th>
                <th scope="col">{words.running}</th>
              </tr>
            </thead>
            <tbody>
              {bars.map((bar, index) => (
                <tr key={`${data[index]!.name}-${index}`}>
                  <th scope="row">{data[index]!.name}</th>
                  <td>{bar.total ? words.total : signed(bar.change)}</td>
                  <td>{numbers.value(bar.running)}</td>
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

/** A share as a CSS percentage, rounded so the style stays short. */
function pct(value: number) {
  return `${Math.round(Math.min(1, Math.max(0, value)) * 100000) / 1000}%`;
}
