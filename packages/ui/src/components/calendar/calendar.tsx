"use client";

import { createContext, useContext, useState } from "react";
import {
  DayButton,
  type DayButtonProps,
  DayPicker,
  type Matcher,
  type MonthGridProps,
  type MonthProps,
} from "react-day-picker";
import { de } from "react-day-picker/locale";

import { buttonVariants } from "@/components/button/button-variants";
import { ChevronLeftGlyph, ChevronRightGlyph } from "@/internal/glyphs";
import { parseIsoDate, toIsoDate } from "@/internal/iso-date";
import { useToday } from "@/internal/today";
import { cn } from "@/lib/cn";

import { CalendarSelection } from "./calendar-selection";

/** A range of days as ISO dates, both ends included. `""` for an end that is not set. */
export type DateRange = { from: string; to: string };

type CalendarCommon = {
  /** The first and the last day that can be chosen, as ISO dates. */
  min?: string;
  max?: string;
  /**
   * The day that counts as today, as an ISO date. The real one unless given; a page rendered on
   * a server only learns the real one in the browser, so its ring appears a moment later.
   */
  today?: string;
  className?: string;
};

export type CalendarProps = CalendarCommon &
  (
    | {
        /** One day. */
        mode?: "single";
        /** The chosen day as an ISO date (`2026-11-14`), or `""` for none (controlled). */
        value?: string;
        /** The day chosen at first (uncontrolled). */
        defaultValue?: string;
        onValueChange?: (value: string) => void;
      }
    | {
        /** A first and a last day. */
        mode: "range";
        /** The chosen range (controlled). */
        value?: DateRange;
        /** The range chosen at first (uncontrolled). */
        defaultValue?: DateRange;
        /** Called once both ends are chosen, with the earlier one first. */
        onValueChange?: (value: DateRange) => void;
      }
  );

/** What is chosen, as a range of days (one day is a range of itself). `undefined` for nothing. */
const Chosen = createContext<{ from: Date; to: Date } | undefined>(undefined);
/** The month a grid shows. */
const ShownMonth = createContext<Date | undefined>(undefined);
/** The day that counts as today, as an ISO date. */
const Today = createContext<string>("");

/** The month, handing its date to the grid inside it. */
function Month({ calendarMonth, displayIndex: _, ...props }: MonthProps) {
  return (
    <ShownMonth value={calendarMonth.date}>
      <div {...props} />
    </ShownMonth>
  );
}

/** The grid of days, with what is chosen drawn over it (`CalendarSelection`). */
function MonthGrid(props: MonthGridProps) {
  const month = useContext(ShownMonth);
  const chosen = useContext(Chosen);
  const today = useContext(Today);
  return (
    <div className="relative">
      {month && (
        // A new month is a new grid: the selection is drawn there, it does not travel to it.
        <CalendarSelection key={toIsoDate(month)} month={month} chosen={chosen} today={today} />
      )}
      <table {...props} />
    </div>
  );
}

/**
 * One day of the month. Today wears the ring (open: possible), what is chosen is Indigo
 * (filled: chosen), the same pair a radio and a tab mark use. A press dips the day.
 *
 * A chosen day does not change itself: the selection is drawn once for the whole month, over
 * the days, with their numbers on it (`CalendarSelection`). Only the day that has the keyboard focus
 * comes forward through it, so its outline shows; on the selection the outline is light and
 * lies inside the day, where an Indigo one would not be seen.
 */
function CalendarDay({ className, modifiers, ...props }: DayButtonProps) {
  return (
    <DayButton
      modifiers={modifiers}
      data-slot="calendar-day"
      className={cn(
        "relative inline-flex size-(--calendar-cell) items-center justify-center rounded-md text-control text-fg select-none",
        "transition-[background-color,scale] spring-seat hover:bg-hover hover:spring-snap active:scale-[0.92] active:spring-snap motion-reduce:active:scale-100",
        "focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        modifiers.outside && "text-fg-muted",
        modifiers.today &&
          "font-semibold after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:inset-ring-[1.5px] after:inset-ring-line",
        modifiers.selected && [
          "focus-visible:text-on-accent focus-visible:-outline-offset-2 focus-visible:outline-on-accent",
          modifiers.today && ["focus-visible:after:inset-ring-0"],
          "forced-colors:focus-visible:text-[HighlightText] forced-colors:focus-visible:[forced-color-adjust:none]",
        ],
        modifiers.disabled && "pointer-events-none text-on-disabled",
        className,
      )}
      {...props}
    />
  );
}

const navButton = cn(
  buttonVariants({ variant: "quiet", size: "sm", iconOnly: true }),
  "text-fg-muted hover:text-fg aria-disabled:pointer-events-none aria-disabled:text-on-disabled",
);

/**
 * Stands in for today while the day is not known (see `Calendar`). The picker must always be
 * given a day: left without one it reads the clock itself, while rendering.
 */
const NO_DAY = new Date(1900, 0, 1);

/**
 * What both kinds of calendar share: the limits, the look, German weekdays from Monday, and the
 * month to open on: the one of what is chosen, else today's.
 */
function useCalendarProps({ min, max, className }: CalendarCommon, chosen?: Date) {
  const first = parseIsoDate(min);
  const last = parseIsoDate(max);
  const disabled: Matcher[] = [
    ...(first ? [{ before: first }] : []),
    ...(last ? [{ after: last }] : []),
  ];
  // From the context, not the prop: it also holds the day the browser reports.
  const now = parseIsoDate(useContext(Today));
  // Nothing chosen and no day yet: there is no month to show. The calendar keeps its place and
  // stays blank until the browser has said what day it is, then starts again on that month.
  const blank = !chosen && !now;
  return {
    start: blank ? "blank" : "month",
    props: {
      locale: de,
      // German weekdays run from Monday on the left, whatever the page around it does; the
      // selection is drawn for that.
      dir: "ltr",
      showOutsideDays: true,
      fixedWeeks: true,
      today: now ?? NO_DAY,
      defaultMonth: chosen ?? now,
      startMonth: first,
      endMonth: last,
      disabled,
      components: {
        Month,
        MonthGrid,
        DayButton: CalendarDay,
        Chevron: ({ orientation }: { orientation?: "left" | "right" | "up" | "down" }) =>
          orientation === "left" ? <ChevronLeftGlyph /> : <ChevronRightGlyph />,
      },
      "data-slot": "calendar",
      className: cn(
        // The days stand 2px apart, so today's ring never touches what is chosen next to it.
        // On a phone they are larger: an invisible target around each would only overlap the
        // next. `--u` is the pitch from one day to the next, which the selection is drawn in.
        "relative w-fit text-control text-fg [--calendar-cell:var(--control-md)] [--calendar-gap:2px] [--u:calc(var(--calendar-cell)+var(--calendar-gap))] pointer-coarse:[--calendar-cell:2.5rem]",
        blank && "invisible",
        className,
      ),
      classNames: {
        months: "flex",
        month: "flex flex-col gap-1.5",
        month_caption: "flex h-(--control-sm) items-center pl-2",
        caption_label: "text-control font-medium text-fg",
        nav: "absolute top-0 right-0 z-10 flex gap-0.5",
        button_previous: navButton,
        button_next: navButton,
        // The spacing also lies around the grid; the margin takes that back.
        month_grid: "-m-(--calendar-gap) border-separate border-spacing-(--calendar-gap)",
        weekday:
          "h-(--control-sm) w-(--calendar-cell) text-center text-sm font-normal text-fg-muted",
        day: "p-0 text-center",
      },
    },
  };
}

/**
 * A month to pick from: one day, or with `mode="range"` a first and a last day. German weekdays,
 * Monday first, six rows always, so the sheet it sits in does not change height from month to
 * month. Dates go in and come out as ISO strings.
 *
 * It is the calendar of a `DateField` and a `DateRangeField`; on its own it suits a page that is
 * about one date.
 */
export function Calendar(props: CalendarProps) {
  // Read in the browser only (`useToday`); pass `today` for the right day from the first paint.
  const today = useToday(props.today);
  return (
    <Today value={today}>
      {props.mode === "range" ? <RangeCalendar {...props} /> : <SingleCalendar {...props} />}
    </Today>
  );
}

function SingleCalendar({
  value,
  defaultValue,
  onValueChange,
  ...common
}: Extract<CalendarProps, { mode?: "single" }>) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const selected = parseIsoDate(value ?? inner);
  const { start, props } = useCalendarProps(common, selected);
  return (
    <Chosen value={selected && { from: selected, to: selected }}>
      <DayPicker
        key={start}
        mode="single"
        // A second press on the chosen day keeps it: a date field is cleared in the field.
        required
        selected={selected}
        onSelect={(date) => {
          const next = toIsoDate(date);
          if (value === undefined) setInner(next);
          onValueChange?.(next);
        }}
        {...props}
      />
    </Chosen>
  );
}

/**
 * The first press sets one end, the second the other; whichever is earlier becomes the start. A
 * third press begins a new range. Between the two presses the range follows the pointer and the
 * arrow keys, so it is seen before it is chosen.
 */
function RangeCalendar({
  value,
  defaultValue,
  onValueChange,
  ...common
}: Extract<CalendarProps, { mode: "range" }>) {
  const [inner, setInner] = useState(defaultValue ?? { from: "", to: "" });
  const range = value ?? inner;
  // One end has been pressed and the other not yet.
  const [anchor, setAnchor] = useState<Date>();
  const [aim, setAim] = useState<Date>();
  const from = parseIsoDate(range.from);
  const to = parseIsoDate(range.to);
  // A range that runs through today opens on today's month („Letzte 90 Tage“ would otherwise
  // open three months back); any other on the month it starts in.
  const now = parseIsoDate(useContext(Today));
  const opening = from && to && now && from <= now && now <= to ? now : from;
  const { start, props } = useCalendarProps(common, opening);
  const other = aim ?? anchor;
  const selected =
    anchor && other
      ? { from: anchor < other ? anchor : other, to: anchor < other ? other : anchor }
      : { from, to };

  return (
    <Chosen value={selected.from && { from: selected.from, to: selected.to ?? selected.from }}>
      <DayPicker
        key={start}
        mode="range"
        selected={selected}
        // The picker works out a range of its own for every press; ours is the one that counts.
        // (Without `onSelect` it would not take `selected` as given.)
        onSelect={(_, day, modifiers) => {
          if (modifiers.disabled) return;
          if (!anchor) {
            setAnchor(day);
            setAim(undefined);
            return;
          }
          const next = {
            from: toIsoDate(day < anchor ? day : anchor),
            to: toIsoDate(day < anchor ? anchor : day),
          };
          setAnchor(undefined);
          setAim(undefined);
          if (value === undefined) setInner(next);
          onValueChange?.(next);
        }}
        onDayMouseEnter={(day) => anchor && setAim(day)}
        onDayFocus={(day) => anchor && setAim(day)}
        {...props}
      />
    </Chosen>
  );
}
