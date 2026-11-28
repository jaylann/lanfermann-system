"use client";

import { useRef, useState } from "react";

import { Calendar } from "@/components/calendar/calendar";
import { InputGroup } from "@/components/input-group/input-group";
import { Popover } from "@/components/popover/popover";
import type { FieldSize } from "@/internal/field";
import {
  type DateLimitLabels,
  DEFAULT_TIME,
  exampleDate,
  exampleMoment,
  formatMoment,
  type HourCycle,
  limitWords,
  outsideLimits,
  parseIsoDate,
  parseMoment,
  splitIsoMoment,
} from "@/internal/iso-date";
import { PickerButton, pickerRow, PickerSheet, PickerTime } from "@/internal/picker-sheet";
import { TypedInput, type TypedInputProps, useTypedValue } from "@/internal/typed-input";
import { worded, type Wording } from "@/internal/wording";
import { useLocale } from "@/locale/locale";

/**
 * The words a `DateField` says on its own. Each is the language's (`LocaleProvider`) unless
 * given; a message is a finished sentence, or a function that is handed what the default names.
 */
export type DateFieldLabels = {
  /** The text is not a date. Handed an example the field would read: "30.11.2026". */
  invalid: Wording<[example: string]>;
  /** With `time`: the text is not a date with a time. Handed "30.11.2026, 09:30". */
  invalidWithTime: Wording<[example: string]>;
  /** The day lies outside `min` and `max`. Handed the limits as the field writes them. */
  limits: Partial<DateLimitLabels>;
  /** Names the button that opens the calendar, for assistive tech: „Kalender öffnen“. */
  open: string;
  /** With `time`: the button that closes the sheet, „Fertig“. */
  done: string;
};

export type DateFieldProps = Omit<
  TypedInputProps,
  "text" | "onTextChange" | "onCommit" | "formValue" | "problem" | "size" | "min" | "max"
> & {
  /** Classes for the field as a whole, e.g. its width. */
  className?: string;
  /**
   * The date as an ISO string (`2026-11-14`, with `time` `2026-11-14T09:30`), or `""` for none
   * (controlled).
   */
  value?: string;
  /** The date at first (uncontrolled). */
  defaultValue?: string;
  /** Reports the date as an ISO string, `""` when the field is empty or cannot be read. */
  onValueChange?: (value: string) => void;
  /** The first and the last day that can be chosen, as ISO dates. */
  min?: string;
  max?: string;
  /** Also take a time of day: an appointment, not only a day. */
  time?: boolean;
  /** With `time`: the clock it is written on, 24 hours (the default) or 12 with AM and PM. */
  hourCycle?: HourCycle;
  /** The size of the field, from the density. */
  size?: FieldSize;
  /** The day that counts as today, as an ISO date. The real one unless given. */
  today?: string;
  /** Any of the field's own words, in place of the language's (`DateFieldLabels`). */
  labels?: Partial<DateFieldLabels>;
};

/**
 * A date: "gültig bis", "fällig am". With `time`, a date and a time of day: "Termin am".
 *
 * It is typed the German way and read when the field is left: `30.11.2026`, `30.11.`, `301126`;
 * with a time `30.11. 9:30`, `30.11.2026, 9 Uhr`, `30.11. 9 pm`. A date without a time gets
 * 09:00. The button opens our calendar, on a phone as well: it looks and works the same
 * everywhere. Under the calendar the time is a small `TimeField`, typed or picked.
 *
 * Under a `LocaleProvider` with `en` it is typed and written the American way, month first:
 * `11/30/2026`, `11/30`, `11-30-2026`, `113026`, with a time `11/30 9:30 am`, `11/30/2026 at
 * 9:30`. A date with dots is not read there: it would have to be guessed which number is the
 * day.
 *
 * The value is an ISO string, without a time zone: `2026-11-30`, or `2026-11-30T09:30`. Inside
 * a `Form`, `name` submits exactly that. Text that is not a date stays in the field to be
 * corrected, the value is empty meanwhile, and a `FieldError` says what is wrong.
 */
export function DateField({
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
  labels,
  disabled,
  ...props
}: DateFieldProps) {
  const { locale, messages } = useLocale();
  const now = parseIsoDate(today);
  const limits = limitWords(labels?.limits, messages.dateField.limits);
  const typed = useTypedValue({
    value,
    defaultValue,
    onValueChange,
    show: (moment) => formatMoment(moment, locale, hourCycle),
    writtenIn: locale,
    read: (text) => {
      const read = parseMoment(text, locale, now);
      if (!read) {
        return {
          problem: time
            ? worded(
                labels?.invalidWithTime ?? messages.dateField.invalidWithTime,
                exampleMoment(locale),
              )
            : worded(labels?.invalid ?? messages.dateField.invalid, exampleDate(locale)),
        };
      }
      const outside = outsideLimits(read.date, min, max, limits, locale);
      if (outside) return { problem: outside };
      return time ? `${read.date}T${read.time || DEFAULT_TIME}` : read.date;
    },
  });
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLDivElement>(null);
  const chosen = splitIsoMoment(typed.value);
  // A time set before a day was picked waits here.
  const [waiting, setWaiting] = useState(DEFAULT_TIME);
  const clock = chosen?.time || waiting;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup ref={field} data-slot="date-field" size={size} className={className}>
        <TypedInput
          // Digits alone are enough for a date ("301126"); a time needs a space or a colon.
          inputMode={time ? undefined : "numeric"}
          placeholder={messages.dateField.example(
            time ? exampleMoment(locale, hourCycle) : exampleDate(locale),
          )}
          text={typed.text}
          onTextChange={typed.setText}
          onCommit={typed.commit}
          formValue={typed.value}
          problem={typed.problem}
          disabled={disabled}
          className="tabular-nums"
          {...props}
          data-slot="date-field-input"
        />
        <PickerButton size={size} disabled={disabled || props.readOnly} label={labels?.open} />
      </InputGroup>
      <PickerSheet
        anchor={field}
        label={time ? messages.dateField.sheetWithTime : messages.dateField.sheet}
        done={time}
        doneLabel={labels?.done}
      >
        <Calendar
          value={chosen?.date ?? ""}
          min={min}
          max={max}
          today={today}
          onValueChange={(date) => {
            typed.set(time ? `${date}T${clock}` : date);
            // A day alone is the whole answer; with a time there is more to set.
            if (!time) setOpen(false);
          }}
        />
        {time && (
          <div className={pickerRow}>
            <PickerTime
              label={messages.dateField.time}
              hourCycle={hourCycle}
              value={clock}
              onValueChange={(next) => {
                // Text that is no time is not taken: the field goes back to the time it had.
                if (next === "") return;
                setWaiting(next);
                if (chosen) typed.set(`${chosen.date}T${next}`);
              }}
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
