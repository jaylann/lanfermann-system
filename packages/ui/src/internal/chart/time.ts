/**
 * The time side of a chart: which moments mark its axis and how they are written.
 *
 * The marks sit on the calendar (whole hours, the 1st, 5th, 10th … of a month, quarters, years)
 * in local time, never every n milliseconds, so a change to summer time or a short February
 * does not shift them. The candidates form one chain, each set inside the one before it (every
 * quarter is a month, every month's 1st is a day of the 1st and 15th, …), so an axis can drop
 * the finer marks where it is narrow and keep the coarser ones in place: each mark carries the
 * coarsest set it belongs to, and CSS hides the finer ones by the chart's width.
 *
 * Pure and server-safe.
 */

import { dateFormatter as format } from "@/lib/format";

// A moment as charts take it: the system's, so a chart and a `RelativeTime` read the same values.
export { type TimeValue, toTime } from "@/lib/format";

/** How far apart the points of a series are: what a single point stands for. */
export type TimeInterval = "hour" | "day" | "week" | "month" | "year";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** What one point stands for, read from how far apart the points are (the middle distance). */
export function inferInterval(times: readonly number[]): TimeInterval {
  if (times.length < 2) return "day";
  const gaps = times
    .slice(1)
    .map((time, index) => time - times[index]!)
    .sort((a, b) => a - b);
  const typical = gaps[gaps.length >> 1]!;
  // Each bound lies just under the next unit, so two points never share one label: points six
  // hours apart are read by the hour (not four to a day), a fortnight apart by their date (not
  // two to a month), a quarter apart by their month (not four to a year).
  if (typical <= 18 * HOUR) return "hour";
  if (typical <= 1.5 * DAY) return "day";
  if (typical <= 27 * DAY) return "week";
  if (typical <= 300 * DAY) return "month";
  return "year";
}

type Level = {
  /** The finest kind of moment in the set. */
  unit: "hour" | "day" | "month" | "year";
  /** Whether a moment belongs to the set. */
  holds(date: Date): boolean;
  /** About how long from one moment of the set to the next, to skip sets far too fine. */
  typical: number;
};

// The first moment of a local day. Not "00:00": where summer time begins at midnight (Cairo,
// Beirut, Santiago, Havana), that day starts at 01:00.
const midnight = (date: Date) => new Date(date).setHours(0, 0, 0, 0) === date.getTime();
const firstOfMonth = (date: Date) => midnight(date) && date.getDate() === 1;
const newYear = (date: Date) => firstOfMonth(date) && date.getMonth() === 0;

const DAYS_BY_FIVE = new Set([1, 5, 10, 15, 20, 25]);

/** The chain, finest first. Each set holds every moment of the sets after it. */
const LEVELS: Level[] = [
  ...[1, 3, 6, 12].map((hours): Level => ({
    unit: "hour",
    holds: (date) =>
      date.getMinutes() === 0 && date.getSeconds() === 0 && date.getHours() % hours === 0,
    typical: hours * HOUR,
  })),
  { unit: "day", holds: midnight, typical: DAY },
  {
    unit: "day",
    holds: (date) => midnight(date) && DAYS_BY_FIVE.has(date.getDate()),
    typical: 5 * DAY,
  },
  {
    unit: "day",
    holds: (date) => midnight(date) && (date.getDate() === 1 || date.getDate() === 15),
    typical: 15 * DAY,
  },
  ...[1, 3, 6].map((months): Level => ({
    unit: "month",
    holds: (date) => firstOfMonth(date) && date.getMonth() % months === 0,
    typical: months * 30.4 * DAY,
  })),
  ...[1, 5, 10, 50].map((years): Level => ({
    unit: "year",
    holds: (date) => newYear(date) && date.getFullYear() % years === 0,
    typical: years * 365 * DAY,
  })),
];

const FINEST: Record<TimeInterval, number> = {
  hour: 0,
  day: 4,
  week: 4,
  month: 7,
  year: 10,
};

/** Every moment of the finest set a level needs, from `start` to `end`. */
function walk(unit: Level["unit"], start: number, end: number): Date[] {
  const date = new Date(start);
  if (unit === "hour") date.setMinutes(0, 0, 0);
  else date.setHours(0, 0, 0, 0);
  if (unit === "month" || unit === "year") date.setDate(1);
  if (unit === "year") date.setMonth(0);
  // Back to the start of the day after every step: a day without a midnight starts at 01:00,
  // and every day after it would be walked at 01:00 and never be a mark.
  if (unit !== "hour") date.setHours(0, 0, 0, 0);
  const moments: Date[] = [];
  while (date.getTime() <= end) {
    if (date.getTime() >= start) moments.push(new Date(date));
    if (unit === "hour") date.setHours(date.getHours() + 1);
    else if (unit === "day") date.setDate(date.getDate() + 1);
    else if (unit === "month") date.setMonth(date.getMonth() + 1);
    else date.setFullYear(date.getFullYear() + 1);
    if (unit !== "hour") date.setHours(0, 0, 0, 0);
  }
  return moments;
}

export type TimeTick = {
  time: number;
  /**
   * How much room it needs to show: 0 shows at every width, 1 from a medium chart up, 2 only on
   * a wide one. The coarser marks keep their place as the finer ones go.
   */
  level: 0 | 1 | 2;
  /** The kind of moment it marks, for its label. */
  unit: Level["unit"];
  /** Whether it is the first of the next coarser unit (a new day, month or year). */
  turn: boolean;
};

export type TimeTickOptions = {
  /** What one point stands for; marks never come finer than that. */
  interval?: TimeInterval;
  /** At most how many marks at each width: wide, medium, narrow. */
  counts?: [number, number, number];
};

/**
 * The marks of a time axis from `start` to `end`. The set is chosen for a wide chart, and each
 * mark says from which width it shows (`level`).
 */
export function timeTicks(
  start: number,
  end: number,
  { interval = "day", counts = [8, 5, 3] }: TimeTickOptions = {},
): TimeTick[] {
  if (!(end > start)) return [];
  const span = end - start;
  const from = FINEST[interval];

  // Count every level that could be wanted; skip the ones that would be thousands of marks.
  const sets: (Date[] | undefined)[] = LEVELS.map((level, index) => {
    if (index < from || span / level.typical > 400) return undefined;
    return walk(level.unit, start, end).filter((date) => level.holds(date));
  });

  /** The finest level with at most `count` marks, preferring one that shows at least two. */
  const choose = (count: number) => {
    let fallback = -1;
    for (let index = from; index < LEVELS.length; index++) {
      const size = sets[index]?.length;
      if (size === undefined || size > count) continue;
      if (size >= 2) return index;
      if (size === 1 && fallback === -1) fallback = index;
    }
    return fallback === -1 ? LEVELS.length - 1 : fallback;
  };

  const wide = choose(counts[0]);
  const medium = Math.max(wide, choose(counts[1]));
  const narrow = Math.max(medium, choose(counts[2]));
  const marks = sets[wide] ?? [];
  const unit = LEVELS[wide]!.unit;

  return marks.map((date) => {
    let rank = wide;
    while (rank + 1 < LEVELS.length && LEVELS[rank + 1]!.holds(date)) rank++;
    return {
      time: date.getTime(),
      level: rank >= narrow ? 0 : rank >= medium ? 1 : 2,
      unit,
      turn:
        unit === "hour"
          ? midnight(date)
          : unit === "day"
            ? firstOfMonth(date) && date.getMonth() === 0
            : unit === "month"
              ? newYear(date)
              : false,
    };
  });
}

/**
 * The label of an axis mark, short: „14:00“, „12. Nov.“, „Nov.“, „2026“. Where a mark turns
 * into the next coarser unit it names that instead: midnight is its day, January its year.
 */
export function tickLabel(tick: TimeTick, locale: Intl.LocalesArgument = "de-DE"): string {
  const date = new Date(tick.time);
  if (tick.unit === "hour") {
    return tick.turn
      ? format(locale, { day: "numeric", month: "short" }).format(date)
      : format(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  if (tick.unit === "day") {
    return tick.turn
      ? format(locale, { year: "numeric" }).format(date)
      : format(locale, { day: "numeric", month: "short" }).format(date);
  }
  if (tick.unit === "month") {
    return tick.turn
      ? format(locale, { year: "numeric" }).format(date)
      : format(locale, { month: "short" }).format(date);
  }
  return format(locale, { year: "numeric" }).format(date);
}

/**
 * A point's moment written out for a readout or a table: „Mi., 12. Nov.“ for a day, „November
 * 2026“ for a month. `withYear` adds the year to days and hours, for a series that crosses one.
 */
export function pointLabel(
  time: number,
  interval: TimeInterval,
  {
    locale = "de-DE",
    withYear = false,
  }: { locale?: Intl.LocalesArgument; withYear?: boolean } = {},
): string {
  const date = new Date(time);
  const year = withYear ? ({ year: "numeric" } as const) : {};
  switch (interval) {
    case "hour":
      return format(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        ...year,
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    case "day":
      return format(locale, { weekday: "short", day: "numeric", month: "short", ...year }).format(
        date,
      );
    case "week":
      return format(locale, { day: "numeric", month: "short", ...year }).format(date);
    case "month":
      return format(locale, { month: "long", year: "numeric" }).format(date);
    case "year":
      return format(locale, { year: "numeric" }).format(date);
  }
}
