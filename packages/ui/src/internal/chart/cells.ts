/**
 * The maths of charts made of cells: a calendar of days laid out by week (`Heatmap`), and the
 * steps a count is sorted into.
 *
 * Days are counted on the calendar in local time, never by dividing milliseconds: a day with a
 * change to summer time is 23 hours long and must still be one day. Weeks start on Monday, as
 * the German calendar does. Pure and server-safe.
 */

/** Local midnight of the day `time` falls on. */
export function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Local midnight of the Monday of the week `time` falls in. */
export function mondayOf(time: number): number {
  const date = new Date(startOfDay(time));
  date.setDate(date.getDate() - weekday(date.getTime()));
  return date.getTime();
}

/** The place of a day in its week: 0 for Monday to 6 for Sunday. */
export function weekday(time: number): number {
  return (new Date(time).getDay() + 6) % 7;
}

/** How many calendar days lie from `from` to `to` (both local midnights, or any time on them). */
export function daysBetween(from: number, to: number): number {
  // Rounded: a day across a change of the clock is an hour short or long.
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);
}

export type CalendarDay = {
  /** Local midnight of the day. */
  time: number;
  /** The week it stands in, from 0 for the week of the first day. */
  column: number;
  /** Its weekday, from 0 for Monday. */
  row: number;
};

export type CalendarMonth = {
  /** Local midnight of the 1st (or of the first day shown, for the month the calendar opens in). */
  time: number;
  /** The week its label stands over. */
  column: number;
};

export type Calendar = {
  days: CalendarDay[];
  /** How many weeks the calendar spans. */
  columns: number;
  /** The months to name above it, each over the first week that begins in it. */
  months: CalendarMonth[];
};

/**
 * The days from `start` to `end`, both included, laid out in weeks: a column per week, Monday
 * at the top. The first and last week may be partial. A month is named over the first week
 * whose Monday falls in it; the month the calendar opens in only if at least two of its weeks
 * show, so its name is never squeezed against the next one.
 */
export function calendar(start: number, end: number): Calendar {
  const first = startOfDay(start);
  const last = startOfDay(end);
  if (last < first) return { days: [], columns: 0, months: [] };
  const origin = mondayOf(first);
  const days: CalendarDay[] = [];
  const date = new Date(first);
  while (date.getTime() <= last) {
    const time = date.getTime();
    days.push({ time, column: Math.floor(daysBetween(origin, time) / 7), row: weekday(time) });
    date.setDate(date.getDate() + 1);
  }
  const columns = (days.at(-1)?.column ?? -1) + 1;

  const months: CalendarMonth[] = [];
  for (let column = 0; column < columns; column++) {
    const monday = new Date(origin);
    monday.setDate(monday.getDate() + column * 7);
    const shown = column === 0 ? new Date(first) : monday;
    const previous = months.at(-1);
    const month = shown.getFullYear() * 12 + shown.getMonth();
    if (previous) {
      const before = new Date(previous.time);
      if (before.getFullYear() * 12 + before.getMonth() === month) continue;
    }
    months.push({ time: shown.getTime(), column });
  }
  // The month the calendar opens in, if it shows for less than two weeks before the next.
  if (months.length > 1 && months[1]!.column - months[0]!.column < 2) months.shift();
  return { days, columns, months };
}

/**
 * Where the steps of a count lie: the quartiles of the values above zero. Zero is a step of its
 * own (nothing happened), so the first step always means "something". Quartiles rather than
 * equal parts of the largest value, so one busy day does not leave every other day in the
 * lowest step.
 */
export function stepBounds(values: Iterable<number | null | undefined>): [number, number, number] {
  const above = [...values]
    .filter((value): value is number => value != null && Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  if (above.length === 0) return [0, 0, 0];
  const at = (share: number) =>
    above[Math.min(above.length - 1, Math.floor(share * above.length))]!;
  return [at(0.25), at(0.5), at(0.75)];
}

/** The step of a value, from 0 (nothing) to 4 (the busiest quarter). */
export function stepOf(
  value: number | null | undefined,
  bounds: [number, number, number],
): 0 | 1 | 2 | 3 | 4 {
  if (value == null || !Number.isFinite(value) || value <= 0) return 0;
  if (value <= bounds[0]) return 1;
  if (value <= bounds[1]) return 2;
  if (value <= bounds[2]) return 3;
  return 4;
}

/** A local day as `"2026-11-14"`, to look a day up by. */
export function dayKey(time: number): string {
  const date = new Date(time);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
