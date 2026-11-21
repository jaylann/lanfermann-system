"use client";

import { type ComponentProps, useSyncExternalStore } from "react";

import { readClock, subscribeClock } from "@/internal/clock";
import { dateFormatter, formatRelativeTime, type TimeValue, toTime } from "@/lib/format";

/** The zone a page is written in on the server, where the reader's is not known yet. */
const SERVER_ZONE = "Europe/Berlin";

export type RelativeTimeProps = Omit<ComponentProps<"time">, "children" | "dateTime"> & {
  /** The moment: an ISO string (`2026-11-21T14:05:00Z`), a `Date` or milliseconds. */
  value: TimeValue;
  /**
   * The moment to count from. Given, the time stands still there: a page rendered once for a
   * request, a test, a story. Left out, it counts from the reader's clock and keeps up.
   */
  now?: TimeValue;
  /** German unless given. */
  locale?: Intl.LocalesArgument;
  /** Shortened for a tight place, a table cell: „vor 5 Min.“, „vor 3 Std.“. */
  short?: boolean;
  /**
   * The zone the days are counted in and a date is written in. The reader's in the browser;
   * on the server, which does not know it, Europe/Berlin unless given.
   */
  timeZone?: string;
  /** Under a minute ago: „gerade eben“. */
  justNowLabel?: string;
  /** Under a minute ahead: „gleich“. */
  soonLabel?: string;
};

const still = () => () => {};
const unknown = () => null;
const inBrowser = () => true;
const onServer = () => false;

/**
 * When something happened, the way people say it: „gerade eben“, „vor 5 Minuten“, „gestern“,
 * „vor 3 Tagen“, and from a week on the date („12. Nov.“). For when a row was last used or
 * changed: „Zuletzt verwendet vor 3 Tagen“. Where the exact moment matters (a log, an
 * invoice), write it out instead, as a `Timeline` does.
 *
 * It keeps up while it is on screen, on one clock for the whole page, and does not move when
 * it changes: a time that ticks should not draw the eye. The `<time>` carries the moment for
 * machines.
 *
 * A server cannot read the clock while a page is prerendered, and does not know the reader's
 * zone. So without `now` the server writes the moment itself („21. Nov. 2026, 14:05“) and the
 * browser turns it into words once it has started. A page rendered per request passes the
 * request's moment as `now`, and nothing changes on load. The words: `formatRelativeTime`.
 */
export function RelativeTime({
  value,
  now,
  locale = "de-DE",
  short = false,
  timeZone,
  justNowLabel,
  soonLabel,
  className,
  ...props
}: RelativeTimeProps) {
  const fixed = now === undefined ? undefined : toTime(now);
  const browser = useSyncExternalStore(still, inBrowser, onServer);
  const clock = useSyncExternalStore(
    fixed === undefined ? subscribeClock : still,
    fixed === undefined ? readClock : unknown,
    unknown,
  );
  const moment = fixed ?? clock;
  // The server and the first render in the browser write in one zone, so both say the same.
  const zone = browser ? timeZone : (timeZone ?? SERVER_ZONE);
  const time = toTime(value);

  const text =
    moment === null
      ? Number.isFinite(time)
        ? dateFormatter(locale, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: zone,
          }).format(time)
        : ""
      : formatRelativeTime(time, {
          now: moment,
          locale,
          style: short ? "short" : "long",
          timeZone: zone,
          justNow: justNowLabel,
          soon: soonLabel,
        });

  return (
    <time
      data-slot="relative-time"
      dateTime={
        typeof value === "string"
          ? value
          : Number.isFinite(time)
            ? new Date(time).toISOString()
            : undefined
      }
      // Proportional digits: it stands in sentences, where tabular ones spread a date apart
      // („1 2. Nov.“). In a column of figures, give it `tabular-nums`.
      className={className}
      {...props}
    >
      {text}
    </time>
  );
}
