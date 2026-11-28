"use client";

import { useEffect, useState } from "react";

import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { cn } from "@/lib/cn";

import { axisOptions } from "./format";
import { lane, laneAt } from "./lane";
import { share } from "./scale";

/** A line of a value axis: its place in the order, its value, and its share up the plot. */
export type AxisTick = { key: number; value: number; at: number; leaving: boolean };

type Kept = { ticks: readonly number[]; domain: [number, number]; leaving: AxisTick[] };

/**
 * The lines of a value axis, each kept by its place in the order rather than by its value: when
 * the range changes, the second line stays the second line, glides to its new height and its
 * number rolls to the new one (Justin, 2026-11-21). A line the new range has no place for fades
 * where it stood; one it adds fades in where it belongs.
 */
export function useAxisTicks(ticks: readonly number[], domain: [number, number]): AxisTick[] {
  const [kept, setKept] = useState<Kept>({ ticks, domain, leaving: [] });
  // Compared while rendering, as React asks for state that follows a prop.
  if (!same(kept.ticks, ticks) || !same(kept.domain, domain)) {
    const gone = kept.ticks.slice(ticks.length).map((value, index) => ({
      key: ticks.length + index,
      value,
      at: share(value, kept.domain),
      leaving: true,
    }));
    setKept({
      ticks,
      domain,
      // Still on their way out, unless the new range has a place for them again.
      leaving: [
        ...kept.leaving.filter(
          (tick) => tick.key >= ticks.length && !gone.some((line) => line.key === tick.key),
        ),
        ...gone,
      ],
    });
  }

  // A line that leaves is dropped once it has faded.
  useEffect(() => {
    if (kept.leaving.length === 0) return;
    const timer = window.setTimeout(() => setKept((now) => ({ ...now, leaving: [] })), 450);
    return () => window.clearTimeout(timer);
  }, [kept.leaving]);

  return [
    ...ticks.map((value, key) => ({ key, value, at: share(value, domain), leaving: false })),
    ...kept.leaving,
  ];
}

/** How a line of the axis comes, moves and goes. */
function motionOf(tick: AxisTick) {
  return tick.leaving
    ? "opacity-0 transition-[translate,opacity] spring-leave"
    : "transition-[translate,opacity] spring-settle in-data-live:starting:opacity-0";
}

/**
 * The numbers of a value axis, in its column beside the plot (an absolute grid item spans to
 * the edge unless both its lines are named). Each rolls to its new value as its line moves.
 */
export function AxisLabels({
  ticks,
  locale,
  format,
}: {
  ticks: readonly AxisTick[];
  locale?: Intl.LocalesArgument;
  format?: Intl.NumberFormatOptions;
}) {
  // The lines that stand decide the decimals together, as the column's sizer does. A line on
  // its way out keeps the ones it was written with, so it does not round as it fades.
  const standing = ticks.filter((tick) => !tick.leaving).map((tick) => tick.value);
  const options = axisOptions(format, standing, locale);
  return (
    <>
      {ticks.map((tick) => (
        <div
          key={tick.key}
          aria-hidden
          className={cn(lane, "col-[1/2] row-[1/2]", motionOf(tick))}
          style={laneAt(undefined, tick.at)}
        >
          <span className="absolute right-0 bottom-0 translate-y-1/2 text-xs whitespace-nowrap text-fg-muted tabular-nums">
            <RollingNumber
              value={tick.value}
              locale={locale}
              format={
                tick.leaving ? axisOptions(format, [...standing, tick.value], locale) : options
              }
            />
          </span>
        </div>
      ))}
    </>
  );
}

/** The hairlines of a value axis, in the plot; `line` colours each by its value (zero). */
export function AxisLines({
  ticks,
  line,
}: {
  ticks: readonly AxisTick[];
  line: (value: number) => string;
}) {
  return (
    <>
      {ticks.map((tick) => (
        <div
          key={tick.key}
          aria-hidden
          className={cn(lane, motionOf(tick))}
          style={laneAt(undefined, tick.at)}
        >
          <div
            className={cn("absolute inset-x-0 bottom-0 h-px translate-y-1/2", line(tick.value))}
          />
        </div>
      ))}
    </>
  );
}

function same(a: readonly number[], b: readonly number[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
