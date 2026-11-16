"use client";

import { useRef, useState } from "react";

import { Calendar, type DateRange } from "@/components/calendar/calendar";
import { InputGroup } from "@/components/input-group/input-group";
import { Popover } from "@/components/popover/popover";
import type { FieldSize } from "@/internal/field";
import {
  DEFAULT_END_TIME,
  DEFAULT_TIME,
  formatGermanRange,
  type HourCycle,
  outsideLimits,
  parseGermanMoment,
  parseGermanRange,
  parseIsoDate,
  parseIsoInterval,
  splitIsoMoment,
  toIsoInterval,
} from "@/internal/iso-date";
import { PickerButton, pickerRow, PickerSheet, PickerTime } from "@/internal/picker-sheet";
import { TypedInput, type TypedInputProps, useTypedValue } from "@/internal/typed-input";

export type DateRangeFieldProps = Omit<
  TypedInputProps,
  "text" | "onTextChange" | "onCommit" | "formValue" | "problem" | "size" | "min" | "max"
> & {
  /** Classes for the field as a whole, e.g. its width. */
  className?: string;
  /**
   * The range as two ISO strings (`{ from: "2026-11-14", to: "2026-11-30" }`, with `time`
   * `2026-11-14T09:00`), both `""` for none (controlled).
   */
  value?: DateRange;
  /** The range at first (uncontrolled). */
  defaultValue?: DateRange;
  /** Reports the range, both ends `""` when the field is empty or cannot be read. */
  onValueChange?: (value: DateRange) => void;
  /** The first and the last day that can be chosen, as ISO dates. */
  min?: string;
  max?: string;
  /** Each end also takes a time of day: a booking, not only a span of days. */
  time?: boolean;
  /** With `time`: the clock they are written on, 24 hours (the default) or 12 with AM and PM. */
  hourCycle?: HourCycle;
  /** The size of the field, from the density. */
  size?: FieldSize;
  /** The day that counts as today, as an ISO date. The real one unless given. */
  today?: string;
};

type End = { date: string; time: string };

/** Both ends as they are stored: with their times, in order, or as days only. */
function settle(from: End, to: End, time: boolean): DateRange {
  if (!time) return { from: from.date, to: to.date };
  const start = from.time || DEFAULT_TIME;
  // On one day the end is not before the start.
  const end =
    to.time || (from.date === to.date && start > DEFAULT_END_TIME ? start : DEFAULT_END_TIME);
  const first = `${from.date}T${start}`;
  const last = `${to.date}T${end}`;
  return first <= last ? { from: first, to: last } : { from: last, to: first };
}

/**
 * A span of days: "Urlaub vom … bis", "Leistungszeitraum". With `time`, from a moment to a
 * moment: a booking.
 *
 * It is typed the German way and read when the field is left: `14.11. – 30.11.2026`,
 * `14.–30.11.`, `14.11.2026 bis 30.11.2026`; with times `14.11., 9:00 – 16.11., 17:00` or, on one
 * day, `14.11. 9–17 Uhr`. One date alone is a range of that day. In the calendar the first press
 * sets one end and the second the other; with times, each end has a small `TimeField` under it.
 *
 * The value is `{ from, to }` in ISO strings. Inside a `Form`, `name` submits both as one ISO
 * interval, `2026-11-14/2026-11-30`: split it at the slash.
 */
export function DateRangeField({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  time = false,
  hourCycle = 24,
  size,
  className,
  today,
  disabled,
  ...props
}: DateRangeFieldProps) {
  const now = parseIsoDate(today);
  const example =
    hourCycle === 12 ? "14.11., 9:00 AM – 16.11., 5:00 PM" : "14.11., 09:00 – 16.11., 17:00";
  const typed = useTypedValue({
    // Inside, the range is its interval string: one value to compare and to submit.
    value: value && toIsoInterval(value),
    defaultValue: toIsoInterval(defaultValue),
    onValueChange: onValueChange && ((interval) => onValueChange(parseIsoInterval(interval))),
    show: (interval) => formatGermanRange(parseIsoInterval(interval), hourCycle),
    read: (text) => {
      const day = parseGermanMoment(text, now);
      const read = parseGermanRange(text, now) ?? (day && { from: day, to: day });
      if (!read) {
        return {
          problem: time
            ? `Bitte geben Sie Beginn und Ende ein, zum Beispiel ${example}.`
            : "Bitte geben Sie einen Zeitraum ein, zum Beispiel 14.11. – 30.11.2026.",
        };
      }
      const outside =
        outsideLimits(read.from.date, min, max) ?? outsideLimits(read.to.date, min, max);
      if (outside) return { problem: outside };
      return toIsoInterval(settle(read.from, read.to, time));
    },
  });
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLDivElement>(null);
  const range = parseIsoInterval(typed.value);
  const from = splitIsoMoment(range.from);
  const to = splitIsoMoment(range.to);
  // Times set before the days were picked wait here.
  const [waiting, setWaiting] = useState({ from: DEFAULT_TIME, to: DEFAULT_END_TIME });
  const clock = { from: from?.time || waiting.from, to: to?.time || waiting.to };

  const setClock = (end: "from" | "to", next: string) => {
    const times = { ...clock, [end]: next };
    setWaiting(times);
    if (!from || !to) return;
    typed.set(
      toIsoInterval(
        settle({ date: from.date, time: times.from }, { date: to.date, time: times.to }, true),
      ),
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup ref={field} data-slot="date-range-field" size={size} className={className}>
        <TypedInput
          placeholder={time ? `z. B. ${example}` : "z. B. 14.11. – 30.11.2026"}
          text={typed.text}
          onTextChange={typed.setText}
          onCommit={typed.commit}
          formValue={typed.value}
          problem={typed.problem}
          disabled={disabled}
          className="tabular-nums"
          {...props}
          data-slot="date-range-field-input"
        />
        <PickerButton size={size} disabled={disabled || props.readOnly} />
      </InputGroup>
      <PickerSheet anchor={field} label="Zeitraum wählen" done={time}>
        <Calendar
          mode="range"
          value={{ from: from?.date ?? "", to: to?.date ?? "" }}
          min={min}
          max={max}
          today={today}
          onValueChange={(days) => {
            typed.set(
              toIsoInterval(
                settle(
                  { date: days.from, time: clock.from },
                  { date: days.to, time: clock.to },
                  time,
                ),
              ),
            );
            // Two days are the whole answer; with times there is more to set.
            if (!time) setOpen(false);
          }}
        />
        {time && (
          <div className={pickerRow}>
            <PickerTime
              label="Von"
              hourCycle={hourCycle}
              value={clock.from}
              // Text that is no time is not taken: the field goes back to the time it had.
              onValueChange={(next) => next !== "" && setClock("from", next)}
            />
            <PickerTime
              label="bis"
              hourCycle={hourCycle}
              value={clock.to}
              onValueChange={(next) => next !== "" && setClock("to", next)}
              onKeyDown={(event) => {
                if (event.key === "Enter") setOpen(false);
              }}
            />
          </div>
        )}
      </PickerSheet>
    </Popover>
  );
}
