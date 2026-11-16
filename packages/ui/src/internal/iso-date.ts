/**
 * Dates travel as ISO strings (`2026-11-14`): no time and no zone, safe to store and to post.
 * These helpers turn them into local `Date`s for a calendar and back, and read a date the way
 * it is typed in German.
 */

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

/** A local date as `"14.11.2026"`. */
export function formatGermanDate(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/**
 * Reads a typed date: `14.11.2026`, `14.11.26`, `1.2.2026`, `14.11.` (this year), `14112026`,
 * `141126`, and ISO. A two-digit year is in this century. `undefined` if it is not a real date.
 */
export function parseGermanDate(text: string, today: Date = new Date()): Date | undefined {
  const typed = text.trim();
  const iso = parseIsoDate(typed);
  if (iso) return iso;
  const match =
    /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{2}|\d{4})?$/.exec(typed) ??
    /^(\d{2})(\d{2})(\d{2}|\d{4})$/.exec(typed);
  if (!match) return undefined;
  const year =
    match[3] === undefined
      ? today.getFullYear()
      : match[3].length === 2
        ? 2000 + Number(match[3])
        : Number(match[3]);
  return fromParts(year, Number(match[2]), Number(match[1]));
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
  const [date = "", time = ""] = value.split("T");
  if (!parseIsoDate(date)) return undefined;
  if (time !== "" && !isIsoTime(time)) return undefined;
  return { date, time };
}

/** `"2026-11-14T09:30"` as `"14.11.2026, 09:30"`; a date alone as `"14.11.2026"`. */
export function formatGermanMoment(value: string, hourCycle: HourCycle = 24): string {
  const moment = splitIsoMoment(value);
  if (!moment) return "";
  const date = formatGermanDate(parseIsoDate(moment.date)!);
  return moment.time ? `${date}, ${formatTime(moment.time, hourCycle)}` : date;
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
  const typed = text.trim();
  const iso = splitIsoMoment(typed);
  if (iso) return iso;

  const read = (datePart: string, timePart: string) => {
    const date = parseGermanDate(datePart, today);
    const time = parseGermanTime(timePart);
    return date && time ? { date: toIsoDate(date), time } : undefined;
  };

  // Said outright: a comma or "um" stands between the two.
  const marked = /^(.+?)\s*(?:,|\bum\b)\s*(.+)$/i.exec(typed);
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
  const date = parseGermanDate(typed, today);
  return date ? { date: toIsoDate(date), time: "" } : undefined;
}

// --- ranges ---------------------------------------------------------------------------------------

/** Two moments, the first not after the second. Each is a date, or a date with a time. */
export type IsoRange = { from: string; to: string };

/**
 * The start of a range, read in the light of its end: "14." takes month and year from the end,
 * "14.11." the year. If that lands after the end, the month or year before is meant: "28.12. –
 * 03.01.2027" starts in 2026.
 */
function startBefore(
  text: string,
  end: { date: string; time: string },
): { date: string; time: string } | undefined {
  const last = parseIsoDate(end.date)!;
  const day = /^(\d{1,2})\.?((?:\s|,).*)?$/.exec(text);
  if (day) {
    const inMonth = (monthsBack: number) => {
      const month = new Date(last.getFullYear(), last.getMonth() - monthsBack, 1);
      return parseGermanMoment(
        `${day[1]}.${month.getMonth() + 1}.${month.getFullYear()}${day[2] ?? ""}`,
      );
    };
    const same = inMonth(0);
    return same && same.date <= end.date ? same : (inMonth(1) ?? same);
  }
  const start = parseGermanMoment(text, last);
  if (!start || start.date <= end.date) return start;
  // Only a start without a year moves when the year it is read against does.
  const yearBefore = parseGermanMoment(text, new Date(last.getFullYear() - 1, 0, 1));
  return yearBefore && yearBefore.date !== start.date ? yearBefore : start;
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
  const typed = text.trim();
  // Every place the text could fall into two: a dash, "bis", or a hyphen (which a date written
  // the ISO way contains too, so each hyphen is tried).
  const cuts: [string, string][] = [];
  for (const match of typed.matchAll(/\s*(?:–|—|\bbis\b|-)\s*/gi)) {
    cuts.push([typed.slice(0, match.index), typed.slice(match.index + match[0].length)]);
  }
  for (const [left, right] of cuts) {
    if (left === "" || right === "") continue;
    const to = parseGermanMoment(right, today);
    if (to) {
      const from = startBefore(left, to);
      if (!from) continue;
      const ordered = `${from.date}T${from.time}` <= `${to.date}T${to.time}`;
      return ordered ? { from, to } : { from: to, to: from };
    }
    // "14.11. 9–17 Uhr": the end is a time on the day of the start.
    const from = parseGermanMoment(left, today);
    const time = parseGermanTime(right);
    if (from && from.time && time) {
      const end = { date: from.date, time };
      return from.time <= time ? { from, to: end } : { from: end, to: from };
    }
  }
  return undefined;
}

/** `{ from, to }` the way it is read: `"14.11.2026 – 30.11.2026"`, with times if it has them. */
export function formatGermanRange(range: IsoRange, hourCycle: HourCycle = 24): string {
  const from = formatGermanMoment(range.from, hourCycle);
  const to = formatGermanMoment(range.to, hourCycle);
  return from && to ? `${from} – ${to}` : "";
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

/** Why a day cannot be chosen, as a sentence; nothing if it lies within the limits. */
export function outsideLimits(date: string, min?: string, max?: string): string | undefined {
  if ((!min || date >= min) && (!max || date <= max)) return undefined;
  const day = (iso: string) => formatGermanDate(parseIsoDate(iso)!);
  if (min && max) return `Bitte wählen Sie ein Datum zwischen dem ${day(min)} und dem ${day(max)}.`;
  return min
    ? `Bitte wählen Sie ein Datum ab dem ${day(min)}.`
    : `Bitte wählen Sie ein Datum bis zum ${day(max!)}.`;
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
