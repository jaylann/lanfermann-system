"use client";

import { type ComponentProps, type KeyboardEvent, useMemo, useState } from "react";

import { chartFormat } from "@/internal/chart/format";
import { labelAlong, lane, laneAt } from "@/internal/chart/lane";
import { Readout, type ReadoutRow } from "@/internal/chart/readout";
import { extent, share, valueAxis } from "@/internal/chart/scale";
import { relativeChange, signedFormat } from "@/internal/chart/steps";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";

export type DumbbellItem = {
  /** What the row is: a service, a project, a person. */
  name: string;
  /** The value before: last year, the plan. */
  from: number;
  /** The value after: this year, what happened. */
  to: number;
  /** Stays the same while the rows change; the name when left out. */
  key?: string;
};

export type DumbbellProps = Omit<ComponentProps<"figure">, "children"> & {
  data: readonly DumbbellItem[];
  /** The names of the two values, in the legend and the readout: `["2025", "2026"]`. */
  labels: [from: string, to: string];
  /** What the chart shows, in a few words: its accessible name and its table's caption. */
  label: string;
  /** How values are written, as `Intl.NumberFormat` options. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** The largest rise first. By default the rows keep the order given. */
  sort?: boolean;
  /** The colour of the value after: the text colour, or Indigo for the one chart a view is about. */
  tone?: "neutral" | "accent";
  /** Whether zero must stand on the axis. Off by default: the change is the point, not the size. */
  zero?: boolean;
  /** Whether a readout names both values of the row under the pointer. */
  readout?: boolean;
  /** Whether the rows are uncovered from left to right where the chart first shows. */
  drawIn?: boolean;
  /** The word for the change in the readout and the table. */
  changeLabel?: string;
};

/**
 * A value before and after, per row: last year's prices against this year's, the hours planned
 * against the hours worked. Two dots on one shared axis, joined by a line, the earlier one in the
 * quiet grey; the change stands at the row's end with its sign („+11 %“), so the direction is
 * read in words as well as in the line.
 *
 * For values over many moments use a `TimeSeriesChart`; for one amount per row, a `BarList`.
 * Keyboard: the chart is one stop, the arrows walk the rows.
 */
export function Dumbbell({
  data,
  labels,
  label,
  format,
  locale = "de-DE",
  sort = false,
  tone = "neutral",
  zero = false,
  readout = true,
  drawIn = true,
  changeLabel = "Veränderung",
  className,
  ...props
}: DumbbellProps) {
  const live = useLive();
  const numbers = chartFormat(locale, format);
  const signedPercent = signedFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const signed = signedFormat(locale, format);
  const [active, setActive] = useState<{ index: number; shown: boolean; entry: number } | null>(
    null,
  );
  const [said, setSaid] = useState("");

  const rows = useMemo(() => {
    const list = data.map((item) => ({ item, change: relativeChange(item.from, item.to) }));
    if (sort) list.sort((a, b) => (b.change ?? -Infinity) - (a.change ?? -Infinity));
    return list;
  }, [data, sort]);
  const axis = useMemo(
    () => valueAxis(extent(data.flatMap((item) => [item.from, item.to])), { zero, count: 4 }),
    [data, zero],
  );
  const at = (value: number) => share(value, axis.domain);
  const toColor = tone === "accent" ? "var(--lf-series-1)" : "var(--lf-text)";
  const fromColor = "var(--lf-series-muted)";

  /** The change at a row's end: a share with its sign, or the amount where there is no share. */
  const changeOf = (index: number) => {
    const { item, change } = rows[index]!;
    return change === null ? signed(item.to - item.from) : signedPercent(change);
  };
  const keyOf = (item: DumbbellItem) => item.key ?? item.name;

  // --- the row under the pointer --------------------------------------------------------------

  const current = active && rows[active.index] ? active : null;
  const activeIndex = current?.shown ? current.index : null;

  const readoutRows = (index: number): ReadoutRow[] => {
    const { item } = rows[index]!;
    return [
      {
        key: "from",
        color: fromColor,
        mark: "swatch",
        value: numbers.value(item.from),
        label: labels[0],
      },
      {
        key: "to",
        color: toColor,
        mark: "swatch",
        value: numbers.value(item.to),
        label: labels[1],
      },
      {
        key: "change",
        color: "transparent",
        mark: "swatch",
        value: changeOf(index),
        label: changeLabel,
      },
    ];
  };
  const sentence = (index: number) =>
    `${rows[index]!.item.name}: ${readoutRows(index)
      .map((row) => `${row.label} ${row.value}`)
      .join(", ")}`;

  const show = (index: number, keyboard = false) => {
    setActive((old) => ({
      index,
      shown: true,
      entry: old?.shown ? old.entry : (old?.entry ?? 0) + 1,
    }));
    if (keyboard) setSaid(sentence(index));
  };
  const hide = () => setActive((old) => (old?.shown ? { ...old, shown: false } : old));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (rows.length === 0) return;
    const last = rows.length - 1;
    const keys: Record<string, number> = {
      ArrowDown: activeIndex === null ? 0 : Math.min(last, activeIndex + 1),
      ArrowRight: activeIndex === null ? 0 : Math.min(last, activeIndex + 1),
      ArrowUp: activeIndex === null ? last : Math.max(0, activeIndex - 1),
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

  const dot =
    "absolute top-1/2 right-0 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-ground in-data-[slot=card]:ring-surface";

  return (
    <figure
      data-slot="dumbbell"
      aria-label={label}
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    >
      {/* The two values' names, each after a dot as the marks are drawn. */}
      <ul aria-hidden className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-body">
        {(
          [
            [labels[0], fromColor],
            [labels[1], toColor],
          ] as const
        ).map(([name, color]) => (
          <li key={name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            {name}
          </li>
        ))}
      </ul>

      <div
        data-slot="dumbbell-plot"
        data-live={live || undefined}
        role="group"
        aria-roledescription="Diagramm"
        // The keys are named only where there is something to walk.
        aria-label={
          rows.length > 0 ? `${label}. Mit den Pfeiltasten durch die Zeilen gehen.` : label
        }
        tabIndex={rows.length > 0 ? 0 : undefined}
        onKeyDown={onKeyDown}
        onBlur={hide}
        onPointerLeave={(event) => event.pointerType === "mouse" && hide()}
        className={cn(
          "relative grid touch-pan-y grid-cols-[minmax(0,min(14rem,38%))_minmax(0,1fr)_auto] gap-x-4 select-none",
          "rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
        )}
      >
        {/* The axis on top: its labels hang from their lines and stay inside the track. */}
        <div
          aria-hidden
          className="chart-ticks relative col-start-2 row-start-1 mb-1 h-3 text-xs leading-none text-fg-muted"
        >
          {/* Narrow, only the first and the last label stay; a little wider every other one
              joins, but not the one beside the last, which would run into it (`chart-ticks`). */}
          {axis.ticks.map((tick, index) => (
            <div
              key={tick}
              data-level={
                index === 0 || index === axis.ticks.length - 1
                  ? 0
                  : index % 2 === 0 && index < axis.ticks.length - 2
                    ? 1
                    : 2
              }
              className={cn(
                lane,
                "transition-[translate] spring-settle motion-reduce:transition-none in-data-live:starting:opacity-0",
              )}
              style={laneAt(at(tick))}
            >
              <span
                className="absolute top-0 right-0 whitespace-nowrap tabular-nums"
                style={labelAlong(at(tick))}
              >
                {numbers.axis(tick)}
              </span>
            </div>
          ))}
        </div>

        {/* The lines of the axis, down through every row, under them. */}
        <div
          aria-hidden
          className="relative col-start-2"
          style={{ gridRow: `2 / span ${Math.max(1, rows.length)}` }}
        >
          {axis.ticks.map((tick) => (
            <div
              key={tick}
              className={cn(
                lane,
                "transition-[translate] spring-settle motion-reduce:transition-none",
              )}
              style={laneAt(at(tick))}
            >
              <div className="absolute inset-y-0 right-0 w-px translate-x-1/2 bg-hairline" />
            </div>
          ))}
        </div>

        {rows.map(({ item }, index) => {
          const from = at(item.from);
          const to = at(item.to);
          const low = Math.min(from, to);
          const high = Math.max(from, to);
          const reading = current?.index === index;
          return (
            <div
              key={keyOf(item)}
              aria-hidden
              data-current={reading && current?.shown ? "" : undefined}
              onPointerEnter={(event) => event.pointerType === "mouse" && show(index)}
              // A touch reads the row until another is touched or the chart loses the focus
              // the touch gave it.
              onPointerDown={(event) => event.pointerType !== "mouse" && show(index)}
              // Placed from the first column: the axis lines stand in the middle column of
              // these rows, and a row placed by the grid would be pushed past them.
              className="col-span-3 col-start-1 grid grid-cols-subgrid items-center rounded-md transition-colors spring-snap data-current:bg-hover"
              style={{ gridRow: index + 2 }}
            >
              <span className="truncate py-1.5 pl-1 text-control text-fg-body">{item.name}</span>
              <div className="relative h-8">
                <div className={cn("absolute inset-0", drawIn && "chart-draw")}>
                  {/* The line between the two, cut out of the track's width. */}
                  <span
                    className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 transition-[clip-path] spring-glide motion-reduce:transition-none"
                    style={{
                      backgroundColor: fromColor,
                      clipPath: `inset(0 ${pct(1 - high)} 0 ${pct(low)})`,
                    }}
                  />
                  <div
                    className={cn(
                      lane,
                      "transition-[translate] spring-glide motion-reduce:transition-none",
                    )}
                    style={laneAt(from)}
                  >
                    <span className={dot} style={{ backgroundColor: fromColor }} />
                  </div>
                  <div
                    className={cn(
                      lane,
                      "transition-[translate] spring-glide motion-reduce:transition-none",
                    )}
                    style={laneAt(to)}
                  >
                    <span className={dot} style={{ backgroundColor: toColor }} />
                  </div>
                </div>

                {readout && reading && current && (
                  <div
                    key={`readout-${current.entry}`}
                    data-shown={current.shown || undefined}
                    className={cn(
                      lane,
                      "z-10 opacity-0 transition-opacity spring-leave data-shown:opacity-100 data-shown:spring-snap data-shown:starting:opacity-0",
                    )}
                    style={laneAt((from + to) / 2)}
                  >
                    <div
                      className="absolute right-0 bottom-[calc(100%+0.25rem)]"
                      style={labelAlong((from + to) / 2)}
                    >
                      <Readout title={item.name} rows={readoutRows(index)} />
                    </div>
                  </div>
                )}
              </div>
              <span className="pr-1 text-right text-sm whitespace-nowrap text-fg-muted tabular-nums">
                {changeOf(index)}
              </span>
            </div>
          );
        })}
      </div>

      {rows.length > 0 && (
        // Hidden by a box around it: Safari draws a table's caption outside a hidden table.
        <div className="sr-only">
          <table>
            <caption>{label}</caption>
            <thead>
              <tr>
                <th scope="col">Zeile</th>
                <th scope="col">{labels[0]}</th>
                <th scope="col">{labels[1]}</th>
                <th scope="col">{changeLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item }, index) => (
                <tr key={keyOf(item)}>
                  <th scope="row">{item.name}</th>
                  <td>{numbers.value(item.from)}</td>
                  <td>{numbers.value(item.to)}</td>
                  <td>{changeOf(index)}</td>
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
