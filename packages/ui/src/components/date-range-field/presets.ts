import type { DateRange } from "@/components/calendar/calendar";
import { parseIsoDate, toIsoDate } from "@/internal/iso-date";

/**
 * A range offered in a `DateRangeField`'s sheet, to be taken with one press: „Letzte 28 Tage“.
 * Its days are worked out from today, so the range moves on with the calendar. Server-safe.
 */
export type DateRangePreset = {
  /** What it is called in the sheet, and in the field once it is chosen: „Letzte 28 Tage“. */
  label: string;
  /** The range on a given day (an ISO date), both ends as ISO dates. */
  range: (today: string) => DateRange;
  /**
   * Set by `lastDays` when it was given no name of its own: how many days it looks back. The
   * field then names the preset in its language („Letzte 28 Tage“, "Last 28 days") in place of
   * `label`, which a helper without hooks can only say in German.
   */
  days?: number;
};

/**
 * The last `count` days, today included: `lastDays(7)` on 21 November is 15 to 21 November. The
 * range a dashboard looks back over, „Letzte 7 Tage“, 28 or 90. Without a `label` the field
 * names it in the language of its `LocaleProvider`; a `label` is said as it is.
 */
export function lastDays(count: number, label?: string): DateRangePreset {
  return {
    label: label ?? `Letzte ${count} Tage`,
    ...(label === undefined ? { days: count } : null),
    range: (today) => {
      const end = parseIsoDate(today);
      if (!end) return { from: "", to: "" };
      // Counted in days of the calendar, not in hours: a change to summer time moves nothing.
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (count - 1));
      return { from: toIsoDate(start), to: today };
    },
  };
}

/** The days of a range, without the times a range with `time` carries. */
function days(range: DateRange): DateRange {
  return { from: range.from.slice(0, 10), to: range.to.slice(0, 10) };
}

/** The preset whose days are the range's on that day, if one is. */
export function presetOf(
  presets: readonly DateRangePreset[] | undefined,
  range: DateRange,
  today: string,
): DateRangePreset | undefined {
  if (!presets || !today || range.from === "") return undefined;
  const chosen = days(range);
  return presets.find((preset) => {
    const offered = preset.range(today);
    return offered.from === chosen.from && offered.to === chosen.to;
  });
}
