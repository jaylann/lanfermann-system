"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ScrollFade } from "@/components/scroll-fade/scroll-fade";
import { calendar, dayKey, stepBounds, stepOf } from "@/internal/chart/cells";
import { chartFormat } from "@/internal/chart/format";
import { Readout } from "@/internal/chart/readout";
import { pointLabel, type TimeValue, toTime } from "@/internal/chart/time";
import { cn } from "@/lib/cn";

export type HeatmapDay = {
  /** The day, as a `Date`, an ISO date (`2026-11-20`) or milliseconds. */
  date: TimeValue;
  /** How much happened that day. Missing days and `null` count as nothing. */
  value: number | null;
};

export type HeatmapProps = Omit<ComponentProps<"figure">, "children"> & {
  data: readonly HeatmapDay[];
  /** What the grid shows, in a few words: its accessible name and the name of its list. */
  label: string;
  /** The first day shown. The earliest day of the data when left out. */
  start?: TimeValue;
  /** The last day shown. The latest day of the data when left out. */
  end?: TimeValue;
  /** What is counted, for the readout: `{ one: "Angebot", other: "Angebote" }`. */
  unit?: { one: string; other: string };
  /** How values are written, as `Intl.NumberFormat` options. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /**
   * The hue the steps run to. `accent` (the default) runs from the trough to Indigo: the empty
   * day is grey and the first step already a hue, so "nothing" and "a little" differ by colour,
   * not only by a shade. `neutral` runs to the text colour, for a page where Indigo is spent.
   */
  tone?: "accent" | "neutral";
  /** The words at the two ends of the scale. */
  scaleLabels?: [less: string, more: string];
  /**
   * Whether the weeks come in one after another, left to right, where the grid first shows (the
   * default, as every chart draws itself in). Off under reduced motion.
   */
  drawIn?: boolean;
};

/** How much of the hue each step mixes into the trough, in OKLab, so the steps rise evenly. */
const STEP_MIX = [0, 28, 52, 76, 100] as const;

const stepColor = (step: number) =>
  step === 0
    ? "var(--lf-trough)"
    : `color-mix(in oklab, var(--heat) ${STEP_MIX[step]}%, var(--lf-trough))`;

type Scrub = { index: number; shown: boolean; entry: number; touch: boolean; keyboard: boolean };
type Place = { x: number; y: number; share: number };

/**
 * How much happened on each day of a stretch of weeks: quotes written, deploys, sign-ins. A
 * column per week, Monday on top, one hue from the empty trough to its full strength in five
 * steps, the busiest quarter of the days at the top. For when the rhythm matters (weekdays,
 * seasons, a quiet August); for amounts over time use a `TimeSeriesChart`.
 *
 * Wider than its place, it scrolls sideways and opens at the newest week. Keyboard: the grid is
 * one stop, the arrows move a day (up and down) or a week (left and right), and each day is said
 * aloud; a hidden list carries every day.
 */
export function Heatmap({
  data,
  label,
  start,
  end,
  unit,
  format,
  locale = "de-DE",
  tone = "accent",
  scaleLabels = ["Weniger", "Mehr"],
  drawIn = true,
  className,
  style,
  ...props
}: HeatmapProps) {
  const numbers = chartFormat(locale, format);
  const plural = useMemo(() => new Intl.PluralRules(locale), [locale]);
  const box = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [scrub, setScrub] = useState<Scrub | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [said, setSaid] = useState("");

  const values = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of data) {
      const time = toTime(day.date);
      if (!Number.isFinite(time) || day.value == null) continue;
      const key = dayKey(time);
      map.set(key, (map.get(key) ?? 0) + day.value);
    }
    return map;
  }, [data]);

  const range = useMemo(() => {
    const times = data.map((day) => toTime(day.date)).filter(Number.isFinite);
    const first = start !== undefined ? toTime(start) : Math.min(...times);
    const last = end !== undefined ? toTime(end) : Math.max(...times);
    return Number.isFinite(first) && Number.isFinite(last) ? calendar(first, last) : calendar(1, 0);
  }, [data, start, end]);

  const bounds = useMemo(() => stepBounds(values.values()), [values]);
  const days = range.days;
  const withYear =
    days.length > 0 &&
    new Date(days[0]!.time).getFullYear() !== new Date(days.at(-1)!.time).getFullYear();

  const valueOf = (index: number) => values.get(dayKey(days[index]!.time)) ?? 0;
  const amount = (value: number) =>
    unit
      ? `${numbers.value(value)} ${plural.select(value) === "one" ? unit.one : unit.other}`
      : numbers.value(value);
  const dayName = (index: number) => pointLabel(days[index]!.time, "day", { locale, withYear });
  const sentence = (index: number) => `${dayName(index)}: ${amount(valueOf(index))}`;

  // Opens at the newest week, where the reader looks first, and stays there while the box
  // changes its width (a window turned or resized) until the reader scrolls away from it.
  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    let pinned = true;
    // Where the pin itself put the box. Its own scroll event comes a frame later, before the
    // resize observer; if the box narrowed in between (a page settling on load), that event
    // would measure the old end against the new width, read it as the reader leaving the end,
    // and the pin would never run again. Only a scroll to somewhere else is the reader's.
    let placed = -1;
    const pin = () => {
      if (!pinned) return;
      element.scrollLeft = element.scrollWidth;
      placed = element.scrollLeft;
    };
    const scrolled = () => {
      if (element.scrollLeft === placed) return;
      placed = -1;
      pinned = element.scrollLeft >= element.scrollWidth - element.clientWidth - 2;
    };
    pin();
    const watch = new ResizeObserver(pin);
    watch.observe(element);
    element.addEventListener("scroll", scrolled, { passive: true });
    return () => {
      watch.disconnect();
      element.removeEventListener("scroll", scrolled);
    };
  }, [range.columns]);

  const active = scrub && days[scrub.index] ? scrub : null;

  // The readout stands outside the scrolling box, over the cell it reads: measured when a cell
  // is read (nothing is measured on load). The keyboard brings its cell into view first.
  useLayoutEffect(() => {
    if (!active?.shown) return;
    const outer = box.current;
    const cell = outer?.querySelector<HTMLElement>(`[data-index="${active.index}"]`);
    if (!outer || !cell) return;
    if (active.keyboard) cell.scrollIntoView({ block: "nearest", inline: "nearest" });
    const frame = outer.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - frame.left;
    setPlace({ x, y: rect.top - frame.top, share: frame.width > 0 ? x / frame.width : 0 });
  }, [active?.index, active?.shown, active?.keyboard, active]);

  // A cell read by a touch stays read until the next touch elsewhere.
  useEffect(() => {
    if (!active?.shown || !active.touch) return;
    const away = (event: globalThis.PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) hide();
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [active?.shown, active?.touch]);

  const show = (index: number, how: { touch?: boolean; keyboard?: boolean } = {}) => {
    setScrub((old) => ({
      index,
      shown: true,
      entry: old?.shown ? old.entry : (old?.entry ?? 0) + 1,
      touch: how.touch ?? false,
      keyboard: how.keyboard ?? false,
    }));
    if (how.keyboard) setSaid(sentence(index));
  };
  function hide() {
    setScrub((old) => (old?.shown ? { ...old, shown: false, touch: false } : old));
  }

  const indexOf = (event: PointerEvent<HTMLElement>) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-index]");
    return cell ? Number(cell.dataset.index) : null;
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const index = indexOf(event);
    if (index === null) return;
    if (scrub?.shown && scrub.index === index) return;
    show(index);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    const index = indexOf(event);
    if (index !== null) show(index, { touch: true });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (days.length === 0) return;
    const last = days.length - 1;
    const from = scrub?.shown ? scrub.index : null;
    const move: Record<string, number> = {
      ArrowRight: 7,
      ArrowLeft: -7,
      ArrowDown: 1,
      ArrowUp: -1,
    };
    let to: number | undefined;
    if (event.key in move)
      to = from === null ? last : Math.min(last, Math.max(0, from + move[event.key]!));
    else if (event.key === "Home") to = 0;
    else if (event.key === "End") to = last;
    else if (event.key === "Escape" && scrub?.shown) {
      event.preventDefault();
      hide();
      return;
    }
    if (to === undefined) return;
    event.preventDefault();
    show(to, { keyboard: true });
  };

  const monthName = new Intl.DateTimeFormat(locale, { month: "short" });
  const weekdayName = new Intl.DateTimeFormat(locale, { weekday: "short" });
  // Monday, Wednesday and Friday name their rows; the others stay quiet.
  const weekdays = [0, 2, 4].map((row) => ({
    row,
    name: weekdayName.format(new Date(2026, 10, 16 + row)).replace(/\.$/, ""),
  }));

  return (
    <figure
      data-slot="heatmap"
      aria-label={label}
      className={cn("flex min-w-0 flex-col gap-3", className)}
      style={
        {
          ...style,
          "--cell": "12px",
          "--cell-gap": "3px",
          "--heat": tone === "accent" ? "var(--lf-series-1)" : "var(--lf-text)",
        } as CSSProperties
      }
      {...props}
    >
      <div ref={box} className="relative flex min-w-0 gap-2">
        {/* The names of the rows stay while the weeks scroll. */}
        <div
          aria-hidden
          className="grid shrink-0 grid-rows-[repeat(7,var(--cell))] gap-y-(--cell-gap) pt-5 text-xs leading-(--cell) text-fg-muted"
        >
          {weekdays.map(({ row, name }) => (
            <span key={row} style={{ gridRow: row + 1 }}>
              {name}
            </span>
          ))}
        </div>

        <ScrollFade
          ref={scroller}
          axis="x"
          className="min-w-0 flex-1 pb-1"
          onScroll={() => active?.touch && hide()}
        >
          {/* Room at the sides and the foot for the rings that reach past the grid (the
              keyboard's, 2px at 4px off; the day being read, 2px at 1px off): the scrolling box
              clips whatever stands outside it. */}
          <div className="inline-flex flex-col gap-2 px-1.5 pb-0.5">
            <div aria-hidden className="relative h-3 text-xs leading-none text-fg-muted">
              {range.months.map((month) => (
                <span
                  key={month.time}
                  className="absolute top-0 whitespace-nowrap"
                  style={{ left: `calc(${month.column} * (var(--cell) + var(--cell-gap)))` }}
                >
                  {monthName.format(month.time).replace(/\.$/, "")}
                </span>
              ))}
            </div>
            <div
              data-slot="heatmap-grid"
              role="group"
              aria-roledescription="Kalender"
              aria-label={`${label}. Mit den Pfeiltasten durch die Tage gehen.`}
              tabIndex={days.length > 0 ? 0 : undefined}
              onPointerMove={onPointerMove}
              onPointerDown={onPointerDown}
              onPointerLeave={(event) => event.pointerType === "mouse" && hide()}
              onPointerCancel={hide}
              onKeyDown={onKeyDown}
              onBlur={hide}
              className={cn(
                "grid auto-cols-(--cell) grid-flow-col grid-rows-[repeat(7,var(--cell))] gap-(--cell-gap)",
                "rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
              )}
            >
              {days.map((day, index) => {
                const step = stepOf(valueOf(index), bounds);
                const current = active?.shown && active.index === index;
                return (
                  <span
                    key={day.time}
                    aria-hidden
                    data-index={index}
                    data-step={step}
                    data-current={current ? "" : undefined}
                    className={cn(
                      "rounded-[3px] outline-offset-1 data-current:outline-2 data-current:outline-fg",
                      drawIn && "chart-cell-in",
                    )}
                    style={
                      {
                        gridColumn: day.column + 1,
                        gridRow: day.row + 1,
                        backgroundColor: stepColor(step),
                        "--chart-cell-at": range.columns > 1 ? day.column / (range.columns - 1) : 0,
                      } as CSSProperties
                    }
                  />
                );
              })}
            </div>
          </div>
        </ScrollFade>

        {active && place && (
          <div
            key={active.entry}
            aria-hidden
            data-shown={active.shown || undefined}
            className={cn(
              "pointer-events-none absolute top-0 left-0 z-10 chart-follow",
              "opacity-0 transition-opacity spring-leave data-shown:opacity-100 data-shown:spring-snap data-shown:starting:opacity-0",
            )}
            style={{ translate: `${place.x}px ${place.y}px` }}
          >
            <div
              className="chart-follow"
              style={{ translate: `${-place.share * 100}% calc(-100% - 0.5rem)` }}
            >
              <Readout
                title={dayName(active.index)}
                rows={[
                  {
                    key: "value",
                    color: stepColor(stepOf(valueOf(active.index), bounds)),
                    // A day with nothing is an empty square, not the trough's colour, which on
                    // the readout's Ink would be a black one.
                    mark: valueOf(active.index) > 0 ? "swatch" : "empty",
                    value: numbers.value(valueOf(active.index)),
                    label: unit
                      ? plural.select(valueOf(active.index)) === "one"
                        ? unit.one
                        : unit.other
                      : "",
                  },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* The scale: from nothing to the busiest quarter. */}
      <div aria-hidden className="flex items-center justify-end gap-1.5 text-xs text-fg-muted">
        <span className="mr-0.5">{scaleLabels[0]}</span>
        {STEP_MIX.map((_, step) => (
          <span
            key={step}
            className="size-3 rounded-[3px]"
            style={{ backgroundColor: stepColor(step) }}
          />
        ))}
        <span className="ml-0.5">{scaleLabels[1]}</span>
      </div>

      {/* Hidden by a box around it, as a table's caption would leak in Safari. */}
      <div className="sr-only">
        <ul aria-label={label}>
          {days.map((day, index) => (
            <li key={day.time}>
              {pointLabel(day.time, "day", { locale, withYear: true })}: {amount(valueOf(index))}
            </li>
          ))}
        </ul>
      </div>
      <p aria-live="polite" className="sr-only">
        {said}
      </p>
    </figure>
  );
}
