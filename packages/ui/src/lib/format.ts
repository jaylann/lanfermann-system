/**
 * How the system writes numbers and moments: German by default („1.234,50 €“, „38 %“, „vor 5
 * Minuten“), the same way in a table cell, a chart, a `RollingNumber` and a sentence, because
 * they all take their formats from here.
 *
 * - A value that rounds to zero never shows a minus („-0“): `signDisplay` is `negative` unless
 *   the caller says otherwise.
 * - A percent is a share: `formatPercent(0.38)` is „38 %“.
 * - Formats are cached by what they are, so options written inline cost nothing per call.
 *
 * Server-safe. Nothing here reads the clock unless the caller leaves out `now`.
 */

/** A moment: a `Date`, milliseconds, or an ISO string. An ISO date alone is local midnight. */
export type TimeValue = Date | string | number;

/** An ISO date without a time: `2026-11-14`. */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A moment as milliseconds. An ISO date without a time (`2026-11-14`) is local midnight. */
export function toTime(value: TimeValue): number {
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  const date = ISO_DATE.exec(value);
  if (date) return new Date(Number(date[1]), Number(date[2]) - 1, Number(date[3])).getTime();
  return new Date(value).getTime();
}

const DEFAULT_LOCALE = "de-DE";

/** A key for a locale: an `Intl.Locale` says its tag, everything else is written out. */
function keyOf(locale: Intl.LocalesArgument, options: object | undefined): string {
  const tag = locale instanceof Intl.Locale ? locale.toString() : locale;
  return JSON.stringify([tag, options]);
}

const numberFormats = new Map<string, Intl.NumberFormat>();

/**
 * The cached `Intl.NumberFormat` every number of the system is written with: German by default,
 * and a minus only where there is something below zero (`signDisplay: "negative"`).
 */
export function numberFormatter(
  locale: Intl.LocalesArgument = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = keyOf(locale, options);
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, { signDisplay: "negative", ...options });
    numberFormats.set(key, format);
  }
  return format;
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();

/** The cached `Intl.DateTimeFormat` the moments of the system are written with. */
export function dateFormatter(
  locale: Intl.LocalesArgument = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = keyOf(locale, options);
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    dateFormats.set(key, format);
  }
  return format;
}

const relativeFormats = new Map<string, Intl.RelativeTimeFormat>();

function relativeFormatter(locale: Intl.LocalesArgument, style: "long" | "short") {
  const key = keyOf(locale, { style });
  let format = relativeFormats.get(key);
  if (!format) {
    format = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style });
    relativeFormats.set(key, format);
  }
  return format;
}

/** `Intl.NumberFormat` options and the language to write in. */
export type FormatOptions = Intl.NumberFormatOptions & {
  /** German unless given. */
  locale?: Intl.LocalesArgument;
};

/** A number in German: „1.234,5“. Decimals and the like as `Intl.NumberFormat` options. */
export function formatNumber(value: number, { locale, ...options }: FormatOptions = {}): string {
  return numberFormatter(locale, options).format(value);
}

export type MoneyOptions = FormatOptions & {
  /** The currency as its ISO code. Euro unless given. */
  currency?: string;
};

/**
 * An amount of money: „1.234,50 €“, cents always written, the way a price or an invoice reads.
 * Whole euros, as a dashboard's figures are written, with `maximumFractionDigits: 0`
 * („117.074 €“).
 */
export function formatMoney(
  value: number,
  { currency = "EUR", locale, ...options }: MoneyOptions = {},
): string {
  return numberFormatter(locale, { style: "currency", currency, ...options }).format(value);
}

/**
 * A share as a percent: `0.38` is „38 %“, whole by default. A change with its sign, as a
 * `StatChange` writes it: `{ signDisplay: "exceptZero" }` („+12 %“). One decimal:
 * `{ maximumFractionDigits: 1 }` („99,8 %“).
 */
export function formatPercent(share: number, { locale, ...options }: FormatOptions = {}): string {
  return numberFormatter(locale, { style: "percent", ...options }).format(share);
}

export type DateOptions = {
  /** German unless given. */
  locale?: Intl.LocalesArgument;
  /**
   * The time zone a moment is written in: the reader's unless given, as `formatRelativeTime`
   * does. A page rendered on a server passes one (`"Europe/Berlin"`), so the server and the
   * browser write the same day. A date without a time ignores it.
   */
  timeZone?: string;
  /** The time of day after the date: „30. Nov. 2026, 14:05“. Not for a date without a time. */
  withTime?: boolean;
};

const DAY_PARTS = { day: "numeric", month: "short", year: "numeric" } as const;
const TIME_PARTS = { hour: "2-digit", minute: "2-digit" } as const;

/**
 * A date written out, the same in every place it is read: „30. Nov. 2026“ in German, „Nov 30,
 * 2026“ in English (`locale: "en-US"`). With `withTime`, „30. Nov. 2026, 14:05“, as a
 * `RelativeTime` writes a moment before it has a clock.
 *
 * An ISO date without a time (`"2026-11-30"`) is a day of the calendar, not a moment: it is
 * written as that day in every time zone, so a due date never moves to the 29th in New York.
 * Everything else (a `Date`, milliseconds, an ISO string with a time) is a moment, written as
 * the day it falls on in `timeZone`. `""` for what is no date.
 */
export function formatDate(
  value: TimeValue,
  { locale = DEFAULT_LOCALE, timeZone, withTime = false }: DateOptions = {},
): string {
  const day = typeof value === "string" ? ISO_DATE.exec(value) : null;
  if (day) {
    // The day as midnight in UTC, written in UTC: the same day wherever this runs.
    const month = Number(day[2]) - 1;
    const date = new Date(Date.UTC(Number(day[1]), month, Number(day[3])));
    // `2026-02-30` would roll over into March: it is no date.
    if (date.getUTCMonth() !== month || date.getUTCDate() !== Number(day[3])) return "";
    return dateFormatter(locale, { ...DAY_PARTS, timeZone: "UTC" }).format(date);
  }
  const time = toTime(value);
  if (!Number.isFinite(time)) return "";
  return dateFormatter(locale, {
    ...DAY_PARTS,
    ...(withTime ? TIME_PARTS : {}),
    ...(timeZone === undefined ? {} : { timeZone }),
  }).format(time);
}

export type RelativeTimeOptions = {
  /** The moment to count from. The clock's unless given. */
  now?: TimeValue;
  /** German unless given. */
  locale?: Intl.LocalesArgument;
  /** `short` for a tight place: „vor 5 Min.“, „vor 3 Std.“. */
  style?: "long" | "short";
  /**
   * The time zone the days are counted in (when „gestern“ begins) and the date is written in.
   * The reader's unless given.
   */
  timeZone?: string;
  /** Under a minute ago. „gerade eben“ in German; the language's own word elsewhere. */
  justNow?: string;
  /** Under a minute ahead. „gleich“ in German; the language's own word elsewhere. */
  soon?: string;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** The day a moment falls on in a time zone, as a count of days, and its year. */
function dayOf(time: number, timeZone?: string) {
  if (timeZone === undefined) {
    const date = new Date(time);
    const year = date.getFullYear();
    return { day: Date.UTC(year, date.getMonth(), date.getDate()) / DAY, year };
  }
  // The parts in the zone, read from a format whose parts are plain numbers.
  const parts = dateFormatter("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(time);
  const part = (type: string) => Number(parts.find((each) => each.type === type)?.value);
  const year = part("year");
  return { day: Date.UTC(year, part("month") - 1, part("day")) / DAY, year };
}

function isGerman(locale: Intl.LocalesArgument): boolean {
  const tag = locale instanceof Intl.Locale ? locale.language : String(locale ?? "");
  return /^de\b/i.test(tag);
}

/**
 * How long ago a moment was, or how long until it comes, the way people say it:
 *
 * | How far        | Written                                      |
 * | -------------- | -------------------------------------------- |
 * | under a minute | „gerade eben“, „gleich“                      |
 * | under an hour  | „vor 5 Minuten“, „in 5 Minuten“              |
 * | the same day   | „vor 3 Stunden“                              |
 * | up to six days | „gestern“, „vorgestern“, „vor 3 Tagen“, „morgen“ |
 * | further        | the date: „12. Nov.“, „12. Nov. 2025“        |
 *
 * Days are counted by the calendar, not in blocks of 24 hours: last night at ten is „gestern“
 * at one in the morning. After a week the date says more than a count, as a `Timeline` writes
 * it. `""` for a moment that is not one.
 */
export function formatRelativeTime(
  value: TimeValue,
  {
    now,
    locale = DEFAULT_LOCALE,
    style = "long",
    timeZone,
    justNow,
    soon,
  }: RelativeTimeOptions = {},
): string {
  const time = toTime(value);
  const current = now === undefined ? Date.now() : toTime(now);
  if (!Number.isFinite(time) || !Number.isFinite(current)) return "";
  const words = relativeFormatter(locale, style);
  const ahead = time > current;
  const distance = Math.abs(time - current);

  if (distance < MINUTE) {
    const german = isGerman(locale);
    if (ahead) return soon ?? (german ? "gleich" : words.format(0, "second"));
    return justNow ?? (german ? "gerade eben" : words.format(0, "second"));
  }
  const sign = ahead ? 1 : -1;
  if (distance < HOUR) return words.format(sign * Math.floor(distance / MINUTE), "minute");

  const then = dayOf(time, timeZone);
  const today = dayOf(current, timeZone);
  const days = then.day - today.day;
  if (days === 0) return words.format(sign * Math.floor(distance / HOUR), "hour");
  if (Math.abs(days) <= 6) return words.format(days, "day");

  return dateFormatter(locale, {
    day: "numeric",
    month: "short",
    ...(then.year === today.year ? {} : { year: "numeric" }),
    ...(timeZone === undefined ? {} : { timeZone }),
  }).format(time);
}
