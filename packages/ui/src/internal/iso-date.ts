/**
 * Dates travel as ISO strings (`2026-11-14`): no time and no zone, safe to store and to post.
 * These helpers turn them into local `Date`s for a calendar and back, and read a date the way
 * it is typed: in German (`30.11.2026`) or, for `en`, the American way (`11/30/2026`).
 */

import type { Locale } from "@/locale/messages";

import { worded, type Wording } from "./wording";

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A local date from its parts, or `undefined` if there is no such day (31 February). */
function fromParts(year: number, month: number, day: number): Date | undefined {
  const date = new Date(year, month - 1, day);
  // `Date` rolls an impossible day over into the next month: only a round trip proves it exists.
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : undefined;
}

/** `"2026-11-14"` as a local date; `undefined` for anything that is not a real ISO date. */
export function parseIsoDate(value: string | null | undefined): Date | undefined {
  const match = value ? ISO.exec(value) : null;
  if (!match) return undefined;
  return fromParts(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** A local date as `"2026-11-14"`. */
export function toIsoDate(date: Date): string {
  const pad = (part: number, length = 2) => String(part).padStart(length, "0");
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * How one language writes a date, and what it puts around one. Everything the readers and
 * writers below differ in between German and English is here, so the two cannot drift apart
 * anywhere else.
 */
type Grammar = {
  /**
   * The ways a date is typed. Each has three groups: the two numbers before the year, and the
   * year (two or four digits, or missing where the way allows it).
   */
  dates: readonly RegExp[];
  /** Which of the two numbers comes first. English never reads a day first. */
  first: "day" | "month";
  /** Day and month as they are written, with the year or without it ("14.11.", "11/14"). */
  write: (day: string, month: string, year?: string) => string;
  /** What stands between a date and its time when it is said outright: a comma, "um", "at". */
  at: RegExp;
  /** Every place a typed range could fall into two: a dash, a hyphen, "bis", "to". */
  cut: RegExp;
  /** Whether the start of a range may be a day alone that takes its month from the end ("14."). */
  dayAlone: boolean;
};

const grammars: Record<Locale, Grammar> = {
  de: {
    dates: [/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{2}|\d{4})?$/, /^(\d{2})(\d{2})(\d{2}|\d{4})$/],
    first: "day",
    write: (day, month, year = "") => `${day}.${month}.${year}`,
    at: /^(.+?)\s*(?:,|\bum\b)\s*(.+)$/i,
    cut: /\s*(?:–|—|\bbis\b|-)\s*/gi,
    dayAlone: true,
  },
  en: {
    // American: the month first, with slashes. Hyphens are read too, but only around a year
    // ("11-30-2026"): between two numbers alone a hyphen is a range's. A date with dots is not
    // read at all. Almost everywhere it is written day first, and "05.06.2026" would have to be
    // guessed; the field says how it wants the date instead.
    dates: [
      /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/,
      /^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/,
      /^(\d{2})(\d{2})(\d{2}|\d{4})$/,
    ],
    first: "month",
    write: (day, month, year) => (year ? `${month}/${day}/${year}` : `${month}/${day}`),
    at: /^(.+?)\s*(?:,|\bat\b)\s*(.+)$/i,
    cut: /\s*(?:–|—|\bto\b|-)\s*/gi,
    dayAlone: false,
  },
};

/** A local date as it is written: `"14.11.2026"` in German, `"11/14/2026"` in English. */
export function formatDate(date: Date, locale: Locale): string {
  const pad = (part: number) => String(part).padStart(2, "0");
  return grammars[locale].write(
    pad(date.getDate()),
    pad(date.getMonth() + 1),
    String(date.getFullYear()),
  );
}

/** A local date as `"14.11.2026"`. */
export function formatGermanDate(date: Date): string {
  return formatDate(date, "de");
}

/**
 * Reads a typed date, and ISO in either language. A two-digit year is in this century, a
 * missing one is this year. `undefined` if it is not a real date.
 *
 * - `de`: `14.11.2026`, `14.11.26`, `1.2.2026`, `14.11.` (this year), `14112026`, `141126`.
 * - `en`, always month first: `11/14/2026`, `11/14/26`, `2/1/2026`, `11/14` (this year),
 *   `11-14-2026`, `11-14-26`, `11142026`, `111426`. Not `14.11.2026`, and no other date with
 *   dots: it is never guessed which number is the day.
 */
export function parseDate(
  text: string,
  locale: Locale,
  today: Date = new Date(),
): Date | undefined {
  const typed = text.trim();
  const iso = parseIsoDate(typed);
  if (iso) return iso;
  const grammar = grammars[locale];
  let match: RegExpExecArray | null = null;
  for (const way of grammar.dates) {
    match = way.exec(typed);
    if (match) break;
  }
  if (!match) return undefined;
  const year =
    match[3] === undefined
      ? today.getFullYear()
      : match[3].length === 2
        ? 2000 + Number(match[3])
        : Number(match[3]);
  const [day, month] = grammar.first === "day" ? [match[1], match[2]] : [match[2], match[1]];
  return fromParts(year, Number(month), Number(day));
}

/**
 * Reads a typed date: `14.11.2026`, `14.11.26`, `1.2.2026`, `14.11.` (this year), `14112026`,
 * `141126`, and ISO. A two-digit year is in this century. `undefined` if it is not a real date.
 */
export function parseGermanDate(text: string, today: Date = new Date()): Date | undefined {
  return parseDate(text, "de", today);
}

// --- times ---------------------------------------------------------------------------------------

const ISO_TIME = /^(\d{2}):(\d{2})$/;

/** `"09:30"` from its parts, or `undefined` if there is no such time (24:00, 9:60). */
function timeFromParts(hours: number, minutes: number): string | undefined {
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return undefined;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return undefined;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Whether a string is an ISO time of day, `"09:30"`. */
export function isIsoTime(value: string | null | undefined): value is string {
  const match = value ? ISO_TIME.exec(value) : null;
  return match ? timeFromParts(Number(match[1]), Number(match[2])) !== undefined : false;
}

/** How a time is written and offered: on a 24-hour clock ("16:30") or with AM and PM. */
export type HourCycle = 12 | 24;

/** The time a field starts from when none was given: the start of a working day. */
export const DEFAULT_TIME = "09:00";
/** The end of a range when none was given. */
export const DEFAULT_END_TIME = "17:00";

/** "am" or "pm" at the end of typed text, however it is written: `PM`, `p.m.`, `p`. */
const MERIDIEM = /\s*([ap])(?:\.?\s?m\.?)?$/i;

/**
 * Reads a typed time and returns it as `"09:30"`: `9`, `09`, `9:30`, `9.30`, `930`, `0930`,
 * `9 Uhr`, `9:30 Uhr`, `9h`, and with AM or PM `9 pm`, `9:30 PM`, `930p`. `undefined` if it is
 * not a time of day.
 *
 * It reads for both languages: a time is typed alike in German and English, and how it is
 * written back is the field's `hourCycle`, not the language.
 */
export function parseGermanTime(text: string): string | undefined {
  const half = MERIDIEM.exec(text.trim())?.[1]?.toLowerCase();
  const typed = text
    .trim()
    .replace(MERIDIEM, "")
    .replace(/\s*(uhr|h)\.?$/i, "")
    .trim();
  const split = /^(\d{1,2})[:.h](\d{2})$/i.exec(typed) ?? /^(\d{1,2})(\d{2})$/.exec(typed);
  const hour = split ? Number(split[1]) : /^\d{1,2}$/.test(typed) ? Number(typed) : undefined;
  if (hour === undefined) return undefined;
  const minutes = split ? Number(split[2]) : 0;
  if (!half) return timeFromParts(hour, minutes);
  // Twelve o'clock is the start of its half: 12 AM is midnight, 12 PM is noon.
  if (hour < 1 || hour > 12) return undefined;
  return timeFromParts((hour % 12) + (half === "p" ? 12 : 0), minutes);
}

/** `"16:30"` the way it is read: as it is, or `"4:30 PM"` on a 12-hour clock. */
export function formatTime(time: string, hourCycle: HourCycle = 24): string {
  const match = ISO_TIME.exec(time);
  if (!match || hourCycle === 24) return time;
  const hour = Number(match[1]);
  return `${hour % 12 === 0 ? 12 : hour % 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
}

/** A time moved by some minutes, staying within the day: 23:50 plus 15 is 00:05. */
export function shiftIsoTime(time: string, minutes: number): string {
  const match = ISO_TIME.exec(time);
  if (!match) return time;
  const day = 24 * 60;
  const total = (((Number(match[1]) * 60 + Number(match[2]) + minutes) % day) + day) % day;
  return timeFromParts(Math.floor(total / 60), total % 60)!;
}

// --- a date with a time ---------------------------------------------------------------------------

/**
 * A moment as it travels: `"2026-11-14"` or, with a time, `"2026-11-14T09:30"`. No zone: it is
 * the wall clock of whoever typed it, which is what an appointment means.
 */
export function splitIsoMoment(
  value: string | null | undefined,
): { date: string; time: string } | undefined {
  if (!value) return undefined;
  const [date = "", time, ...more] = value.split("T");
  if (!parseIsoDate(date)) return undefined;
  // A "T" promises a time, and one only: "2026-11-14T" and "2026-11-14T09:30T…" are no moments.
  if (more.length > 0 || (time !== undefined && !isIsoTime(time))) return undefined;
  return { date, time: time ?? "" };
}

/**
 * `"2026-11-14T09:30"` as it is written: `"14.11.2026, 09:30"` in German, `"11/14/2026, 09:30"`
 * in English; a date alone as the date. The clock is the `hourCycle`'s in both.
 */
export function formatMoment(value: string, locale: Locale, hourCycle: HourCycle = 24): string {
  const moment = splitIsoMoment(value);
  if (!moment) return "";
  const date = formatDate(parseIsoDate(moment.date)!, locale);
  return moment.time ? `${date}, ${formatTime(moment.time, hourCycle)}` : date;
}

/** `"2026-11-14T09:30"` as `"14.11.2026, 09:30"`; a date alone as `"14.11.2026"`. */
export function formatGermanMoment(value: string, hourCycle: HourCycle = 24): string {
  return formatMoment(value, "de", hourCycle);
}

/**
 * Reads a typed date that may carry a time and returns it as ISO (the time is `""` for a date
 * alone). A number of four digits after the date is a year from 1900 on and a time below that
 * (`14.11. 0930`).
 *
 * - `de`: `14.11.2026, 9:30`, `14.11. 9 Uhr`, `14.11.2026 um 09:30`, `14.11.2026`.
 * - `en`: `11/14/2026, 9:30`, `11/14 9 am`, `11/14/2026 at 9:30 PM`, `11/14/2026`.
 */
export function parseMoment(
  text: string,
  locale: Locale,
  today: Date = new Date(),
): { date: string; time: string } | undefined {
  const typed = text.trim();
  const iso = splitIsoMoment(typed);
  if (iso) return iso;

  const read = (datePart: string, timePart: string) => {
    const date = parseDate(datePart, locale, today);
    const time = parseGermanTime(timePart);
    return date && time ? { date: toIsoDate(date), time } : undefined;
  };

  // Said outright: a comma or "um" ("at") stands between the two.
  const marked = grammars[locale].at.exec(typed);
  if (marked) return read(marked[1]!, marked[2]!);

  // Otherwise the last word may be the time, unless the whole thing is a date as it stands.
  // "Uhr", AM or PM settle it: what stands before them is a time.
  const half = MERIDIEM.exec(typed)?.[0] ?? "";
  const bare = typed.replace(MERIDIEM, "");
  const said = half !== "" || /\s*(?:uhr|h)\.?$/i.test(bare);
  const words = /^(.*\S)\s+(\S+)$/.exec(bare.replace(/\s*(?:uhr|h)\.?$/i, ""));
  if (words) {
    const last = words[2]!;
    const year = !said && /^\d{4}$/.test(last) && Number(last) >= 1900;
    if (!year) {
      const moment = read(words[1]!, last + half);
      if (moment) return moment;
    }
  }
  const date = parseDate(typed, locale, today);
  return date ? { date: toIsoDate(date), time: "" } : undefined;
}

/**
 * Reads a typed date that may carry a time and returns it as ISO: `14.11.2026, 9:30`,
 * `14.11. 9 Uhr`, `14.11.2026 um 09:30`, `14.11.2026` (then the time is `""`). A number of four
 * digits after the date is a year from 1900 on and a time below that (`14.11. 0930`).
 */
export function parseGermanMoment(
  text: string,
  today: Date = new Date(),
): { date: string; time: string } | undefined {
  return parseMoment(text, "de", today);
}

// --- ranges ---------------------------------------------------------------------------------------

/** Two moments, the first not after the second. Each is a date, or a date with a time. */
export type IsoRange = { from: string; to: string };

/**
 * The start of a range, read in the light of its end: "14." takes month and year from the end
 * (German only), "14.11." or "11/14" the year. If that lands after the end, the month or year
 * before is meant: "28.12. – 03.01.2027" starts in 2026.
 */
function startBefore(
  text: string,
  end: { date: string; time: string },
  locale: Locale,
): { date: string; time: string } | undefined {
  const last = parseIsoDate(end.date)!;
  const day = grammars[locale].dayAlone ? /^(\d{1,2})\.?((?:\s|,).*)?$/.exec(text) : null;
  if (day) {
    const inMonth = (monthsBack: number) => {
      const month = new Date(last.getFullYear(), last.getMonth() - monthsBack, 1);
      return parseMoment(
        `${day[1]}.${month.getMonth() + 1}.${month.getFullYear()}${day[2] ?? ""}`,
        locale,
      );
    };
    const same = inMonth(0);
    return same && same.date <= end.date ? same : (inMonth(1) ?? same);
  }
  const start = parseMoment(text, locale, last);
  if (!start || start.date <= end.date) return start;
  // Only a start without a year moves when the year it is read against does.
  const yearBefore = parseMoment(text, locale, new Date(last.getFullYear() - 1, 0, 1));
  return yearBefore && yearBefore.date !== start.date ? yearBefore : start;
}

/**
 * Reads a typed range. A start without a year takes it from the end, and the two ends come back
 * in order.
 *
 * - `de`: `14.11. – 30.11.2026`, `14.–30.11.2026` (the month from the end too), `14.11.2026 bis
 *   30.11.2026`, `14.11.-30.11.`, and with times `14.11., 9:00 – 16.11., 17:00` or `14.11. 9–17
 *   Uhr` (one day).
 * - `en`: `11/14 – 11/30/2026`, `11/14/2026 to 11/30/2026`, `11/14-11/30`, `11-14-2026 -
 *   11-30-2026`, and with times `11/14, 9:00 – 11/16, 17:00` or `11/14 9 am – 5 pm` (one day).
 *   The start is always a whole date: a day alone ("14 – 11/30") is not read.
 */
export function parseRange(
  text: string,
  locale: Locale,
  today: Date = new Date(),
): { from: { date: string; time: string }; to: { date: string; time: string } } | undefined {
  const typed = text.trim();
  // Every place the text could fall into two: a dash, "bis" ("to"), or a hyphen (which a date
  // written the ISO way or with hyphens contains too, so each hyphen is tried).
  const cuts: [string, string][] = [];
  for (const match of typed.matchAll(grammars[locale].cut)) {
    cuts.push([typed.slice(0, match.index), typed.slice(match.index + match[0].length)]);
  }
  for (const [left, right] of cuts) {
    if (left === "" || right === "") continue;
    const to = parseMoment(right, locale, today);
    if (to) {
      const from = startBefore(left, to, locale);
      if (!from) continue;
      const ordered = `${from.date}T${from.time}` <= `${to.date}T${to.time}`;
      return ordered ? { from, to } : { from: to, to: from };
    }
    // "14.11. 9–17 Uhr": the end is a time on the day of the start.
    const from = parseMoment(left, locale, today);
    const time = parseGermanTime(right);
    if (from && from.time && time) {
      const end = { date: from.date, time };
      return from.time <= time ? { from, to: end } : { from: end, to: from };
    }
  }
  return undefined;
}

/**
 * Reads a typed range: `14.11. – 30.11.2026`, `14.–30.11.2026`, `14.11.2026 bis 30.11.2026`,
 * `14.11.-30.11.`, and with times `14.11., 9:00 – 16.11., 17:00` or `14.11. 9–17 Uhr` (one day).
 * A start without a year or month takes them from the end. The two ends come back in order.
 */
export function parseGermanRange(
  text: string,
  today: Date = new Date(),
): { from: { date: string; time: string }; to: { date: string; time: string } } | undefined {
  return parseRange(text, "de", today);
}

/**
 * `{ from, to }` the way it is read: `"14.11.2026 – 30.11.2026"`, in English `"11/14/2026 –
 * 11/30/2026"`, with times if it has them.
 */
export function formatRange(range: IsoRange, locale: Locale, hourCycle: HourCycle = 24): string {
  const from = formatMoment(range.from, locale, hourCycle);
  const to = formatMoment(range.to, locale, hourCycle);
  return from && to ? `${from} – ${to}` : "";
}

/** `{ from, to }` the way it is read: `"14.11.2026 – 30.11.2026"`, with times if it has them. */
export function formatGermanRange(range: IsoRange, hourCycle: HourCycle = 24): string {
  return formatRange(range, "de", hourCycle);
}

// --- examples -------------------------------------------------------------------------------------

/**
 * What a field shows as an example of what it reads, in its placeholder and in the message for
 * text it could not read. They are written by the same grammar the readers use, so an example
 * can never name a form the field would refuse (a test reads each one back).
 */
const EXAMPLE = { from: "2026-11-14", until: "2026-11-16", to: "2026-11-30" };

/** A date without its year, the short way a range starts: `"14.11."`, `"11/14"`. */
function shortDate(iso: string, locale: Locale): string {
  return grammars[locale].write(iso.slice(8, 10), iso.slice(5, 7));
}

/** `"30.11.2026"`, in English `"11/30/2026"`. */
export function exampleDate(locale: Locale): string {
  return formatMoment(EXAMPLE.to, locale);
}

/** `"30.11.2026, 09:30"`, in English `"11/30/2026, 09:30"`; on a 12-hour clock with `AM`. */
export function exampleMoment(locale: Locale, hourCycle: HourCycle = 24): string {
  return formatMoment(`${EXAMPLE.to}T09:30`, locale, hourCycle);
}

/** `"14.11. – 30.11.2026"`, in English `"11/14 – 11/30/2026"`. */
export function exampleRange(locale: Locale): string {
  return `${shortDate(EXAMPLE.from, locale)} – ${exampleDate(locale)}`;
}

/** `"14.11., 09:00 – 16.11., 17:00"`, in English `"11/14, 09:00 – 11/16, 17:00"`. */
export function exampleTimedRange(locale: Locale, hourCycle: HourCycle = 24): string {
  const end = (iso: string, time: string) =>
    `${shortDate(iso, locale)}, ${formatTime(time, hourCycle)}`;
  return `${end(EXAMPLE.from, DEFAULT_TIME)} – ${end(EXAMPLE.until, DEFAULT_END_TIME)}`;
}

/**
 * A range as one string, the ISO 8601 way: `"2026-11-14/2026-11-30"`. That is what a range field
 * submits under its name. `""` for no range.
 */
export function toIsoInterval(range: IsoRange | null | undefined): string {
  return range && splitIsoMoment(range.from) && splitIsoMoment(range.to)
    ? `${range.from}/${range.to}`
    : "";
}

/** `"2026-11-14/2026-11-30"` as `{ from, to }`; both empty for anything else. */
export function parseIsoInterval(interval: string | null | undefined): IsoRange {
  const [from = "", to = ""] = (interval ?? "").split("/");
  return splitIsoMoment(from) && splitIsoMoment(to) ? { from, to } : { from: "", to: "" };
}

/** The sentences that say why a day cannot be chosen, each with its days already written. */
export type LimitWords = {
  between: (min: string, max: string) => string;
  from: (min: string) => string;
  until: (max: string) => string;
};

const germanLimitWords: LimitWords = {
  between: (min, max) => `Bitte wählen Sie ein Datum zwischen dem ${min} und dem ${max}.`,
  from: (min) => `Bitte wählen Sie ein Datum ab dem ${min}.`,
  until: (max) => `Bitte wählen Sie ein Datum bis zum ${max}.`,
};

/**
 * The same sentences as a caller may give them to a date field (`labels.limits`): each a
 * finished sentence, or a function that is handed the days as the field writes them.
 */
export type DateLimitLabels = {
  /** The day lies outside `min` and `max`. */
  between: Wording<[min: string, max: string]>;
  /** The day lies before `min`, and there is no `max`. */
  from: Wording<[min: string]>;
  /** The day lies after `max`, and there is no `min`. */
  until: Wording<[max: string]>;
};

/** The sentences a field says: the caller's where one was given, else the language's. */
export function limitWords(
  given: Partial<DateLimitLabels> | undefined,
  defaults: LimitWords,
): LimitWords {
  return {
    between: (min, max) => worded(given?.between ?? defaults.between, min, max),
    from: (min) => worded(given?.from ?? defaults.from, min),
    until: (max) => worded(given?.until ?? defaults.until, max),
  };
}

/**
 * Why a day cannot be chosen, as a sentence; nothing if it lies within the limits. The days are
 * written the way the field of that language reads them.
 */
export function outsideLimits(
  date: string,
  min?: string,
  max?: string,
  words: LimitWords = germanLimitWords,
  locale: Locale = "de",
): string | undefined {
  if ((!min || date >= min) && (!max || date <= max)) return undefined;
  const day = (iso: string) => formatDate(parseIsoDate(iso)!, locale);
  if (min && max) return words.between(day(min), day(max));
  return min ? words.from(day(min)) : words.until(day(max!));
}

// --- a range in a calendar ------------------------------------------------------------------------

/** The place of a day in its week, Monday first: 0 for Monday, 6 for Sunday. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// --- times to pick from --------------------------------------------------------------------------

/** The times of a day in steps of so many minutes, within the limits: `["08:00", "08:15", …]`. */
export function timesOfDay(step: number, min = "00:00", max = "23:59"): string[] {
  const times: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += Math.max(1, Math.round(step))) {
    const time = shiftIsoTime("00:00", minutes);
    if (time >= min && time <= max) times.push(time);
  }
  return times;
}

/**
 * Whether a time is one that typed text could become: `"9"` finds 09:00 to 09:45, `"93"` and
 * `"9:3"` find 09:30, `"14"` finds 14:…. On a 12-hour clock `"4"` finds four in the morning and
 * in the afternoon, `"4p"` only the afternoon; the hour may be typed either way, `"16"` too.
 * Text without a digit narrows nothing: every time is offered.
 */
export function timeMatches(time: string, typed: string, hourCycle: HourCycle = 24): boolean {
  const digits = typed.replace(/\D/g, "");
  if (digits === "") return true;
  const half = /\d\s*([ap])/i.exec(typed)?.[1]?.toLowerCase();
  if (half && (half === "p") !== time >= "12:00") return false;
  const whole = time.replace(":", "");
  // An hour is also typed without its leading zero, and on a 12-hour clock as it is said.
  const ways = [whole, whole.replace(/^0/, "")];
  if (hourCycle === 12) ways.push(formatTime(time, 12).replace(/\D/g, ""));
  return ways.some((way) => way.startsWith(digits));
}
