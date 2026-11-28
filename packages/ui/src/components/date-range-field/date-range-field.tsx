"use client";

import { useRef, useState } from "react";

import { Calendar, type DateRange } from "@/components/calendar/calendar";
import { InputGroup } from "@/components/input-group/input-group";
import { Popover } from "@/components/popover/popover";
import type { FieldSize } from "@/internal/field";
import {
  type DateLimitLabels,
  DEFAULT_END_TIME,
  DEFAULT_TIME,
  exampleRange,
  exampleTimedRange,
  formatRange,
  type HourCycle,
  limitWords,
  outsideLimits,
  parseIsoDate,
  parseIsoInterval,
  parseMoment,
  parseRange,
  splitIsoMoment,
  toIsoInterval,
} from "@/internal/iso-date";
import { ListMark } from "@/internal/list-mark";
import { PickerButton, pickerRow, PickerSheet, PickerTime } from "@/internal/picker-sheet";
import { useToday } from "@/internal/today";
import { TypedInput, type TypedInputProps, useTypedValue } from "@/internal/typed-input";
import { worded, type Wording } from "@/internal/wording";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

import { type DateRangePreset, presetOf } from "./presets";

/**
 * The words a `DateRangeField` says on its own. Each is the language's (`LocaleProvider`)
 * unless given; a message is a finished sentence, or a function that is handed what the default
 * names.
 */
export type DateRangeFieldLabels = {
  /** The text is not a range. Handed an example the field would read: "14.11. – 30.11.2026". */
  invalid: Wording<[example: string]>;
  /** With `time`: handed "14.11., 09:00 – 16.11., 17:00", on the field's clock. */
  invalidWithTime: Wording<[example: string]>;
  /** A day lies outside `min` and `max`. Handed the limits as the field writes them. */
  limits: Partial<DateLimitLabels>;
  /** Names the button that opens the calendar, for assistive tech: „Kalender öffnen“. */
  open: string;
  /** With `time`: the button that closes the sheet, „Fertig“. */
  done: string;
};

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
  /**
   * Ranges to take with one press, worked out from today: `[lastDays(7), lastDays(28),
   * lastDays(90)]`. They stand in a column at the left of the calendar (above it on a phone),
   * and the one the range is carries the disc. The field then says its name („Letzte 28 Tage“)
   * and reads the name back when it is typed; with `time` it says the dates.
   */
  presets?: readonly DateRangePreset[];
  /** Names the presets for assistive tech. */
  presetsLabel?: string;
  /** Any of the field's other words, in place of the language's (`DateRangeFieldLabels`). */
  labels?: Partial<DateRangeFieldLabels>;
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
 * Under a `LocaleProvider` with `en` it is typed and written the American way, month first:
 * `11/14 – 11/30/2026`, `11/14/2026 to 11/30/2026`, `11/14-11/30`; with times `11/14, 9:00 –
 * 11/16, 17:00` or `11/14 9 am – 5 pm`. Dates with dots are not read there.
 *
 * The value is `{ from, to }` in ISO strings. Inside a `Form`, `name` submits both as one ISO
 * interval, `2026-11-14/2026-11-30`: split it at the slash.
 *
 * On a dashboard it carries `presets`: „Letzte 7 Tage“, 28, 90 (`lastDays`), taken with one
 * press. They are worked out from today, which the browser knows and a server does not: pass
 * `today` where the page is rendered ahead of time, so the field reads the same before and
 * after it has started.
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
  presets,
  presetsLabel,
  labels,
  disabled,
  ...props
}: DateRangeFieldProps) {
  const { locale, messages } = useLocale();
  const limits = limitWords(labels?.limits, messages.dateField.limits);
  const outside = (date: string) => outsideLimits(date, min, max, limits, locale);
  const todayIso = useToday(today);
  const now = parseIsoDate(todayIso);
  const example = time ? exampleTimedRange(locale, hourCycle) : exampleRange(locale);
  // A preset is named in the field (Justin, 2026-11-21); a booking's times are not in a name.
  const named = !time;
  /** What a preset is called: as `lastDays` counts it, in the field's language, or its label. */
  const nameOf = (preset: DateRangePreset) =>
    preset.days === undefined ? preset.label : messages.dateRangeField.lastDays(preset.days);
  /** The range as the field writes it: a preset's name, or its two ends. */
  const showOn = (on: string) => (interval: string) => {
    const range = parseIsoInterval(interval);
    const preset = named ? presetOf(presets, range, on) : undefined;
    return preset ? nameOf(preset) : formatRange(range, locale, hourCycle);
  };
  const typed = useTypedValue({
    // Inside, the range is its interval string: one value to compare and to submit.
    value: value && toIsoInterval(value),
    defaultValue: toIsoInterval(defaultValue),
    onValueChange: onValueChange && ((interval) => onValueChange(parseIsoInterval(interval))),
    show: showOn(todayIso),
    writtenIn: locale,
    read: (text) => {
      // A preset's name, typed, is that preset.
      const preset =
        named && todayIso
          ? presets?.find((each) => nameOf(each).toLowerCase() === text.trim().toLowerCase())
          : undefined;
      if (preset) {
        const range = preset.range(todayIso);
        const problem = outside(range.from) ?? outside(range.to);
        if (problem) return { problem };
        return toIsoInterval(range);
      }
      const day = parseMoment(text, locale, now);
      const read = parseRange(text, locale, now) ?? (day && { from: day, to: day });
      if (!read) {
        return {
          problem: time
            ? worded(labels?.invalidWithTime ?? messages.dateRangeField.invalidWithTime, example)
            : worded(labels?.invalid ?? messages.dateRangeField.invalid, example),
        };
      }
      const problem = outside(read.from.date) ?? outside(read.to.date);
      if (problem) return { problem };
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

  // The browser learns the day after its first render. A range that is a preset is named from
  // then on, unless someone has begun to type over it.
  const [knownDay, setKnownDay] = useState(todayIso);
  if (knownDay !== todayIso) {
    setKnownDay(todayIso);
    if (typed.text === showOn(knownDay)(typed.value)) typed.setText(showOn(todayIso)(typed.value));
  }

  const chosen = presetOf(presets, range, todayIso);
  /** A preset is the whole answer: its days, with the times the sheet holds, and the sheet goes. */
  const pick = (preset: DateRangePreset) => {
    const days = preset.range(todayIso);
    typed.set(
      toIsoInterval(
        settle({ date: days.from, time: clock.from }, { date: days.to, time: clock.to }, time),
      ),
    );
    setOpen(false);
  };
  /** A preset that reaches past `min` or `max`, or on a day not known yet, cannot be taken. */
  const unavailable = (preset: DateRangePreset) => {
    const days = preset.range(todayIso);
    if (days.from === "") return true;
    return (outside(days.from) ?? outside(days.to)) !== undefined;
  };
  const presetList = presets && presets.length > 0 && (
    <PresetList
      presets={presets}
      chosen={chosen}
      label={presetsLabel ?? messages.dateRangeField.presets}
      nameOf={nameOf}
      unavailable={unavailable}
      onPick={pick}
    />
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup ref={field} data-slot="date-range-field" size={size} className={className}>
        <TypedInput
          placeholder={messages.dateField.example(example)}
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
        <PickerButton size={size} disabled={disabled || props.readOnly} label={labels?.open} />
      </InputGroup>
      <PickerSheet
        anchor={field}
        label={messages.dateRangeField.sheet}
        done={time}
        doneLabel={labels?.done}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          {presetList}
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
        </div>
        {time && (
          <div className={pickerRow}>
            <PickerTime
              label={messages.dateRangeField.from}
              hourCycle={hourCycle}
              value={clock.from}
              // Text that is no time is not taken: the field goes back to the time it had.
              onValueChange={(next) => next !== "" && setClock("from", next)}
            />
            <PickerTime
              label={messages.dateRangeField.to}
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

/**
 * The presets in the sheet: a column at the left of the calendar behind a hairline, from `sm`
 * up, and above it on a phone, where the calendar takes the sheet's width. Each is a row of a
 * list with the disc at its right end for the one the range is, the chosen-row rule of every
 * list (Justin, 2026-11-21, over a row of quiet keys above the calendar, which wrapped).
 */
function PresetList({
  presets,
  chosen,
  label,
  nameOf,
  unavailable,
  onPick,
}: {
  presets: readonly DateRangePreset[];
  chosen: DateRangePreset | undefined;
  label: string;
  nameOf: (preset: DateRangePreset) => string;
  unavailable: (preset: DateRangePreset) => boolean;
  onPick: (preset: DateRangePreset) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="date-range-field-presets"
      className="flex flex-col gap-0.5 border-b border-hairline pb-3 sm:w-40 sm:border-r sm:border-b-0 sm:pr-3 sm:pb-0"
    >
      {presets.map((preset) => {
        const on = preset === chosen;
        return (
          <button
            key={preset.label}
            type="button"
            data-slot="date-range-field-preset"
            aria-pressed={on}
            disabled={unavailable(preset)}
            onClick={() => onPick(preset)}
            className={cn(
              "group flex min-h-(--control-item) items-center gap-2.5 rounded-md px-2.5 text-left text-control whitespace-nowrap text-fg select-none",
              "transition-colors spring-settle hover:bg-hover hover:spring-snap",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              "disabled:pointer-events-none disabled:text-on-disabled",
            )}
          >
            {nameOf(preset)}
            <ListMark on={on} className="ml-auto" />
          </button>
        );
      })}
    </div>
  );
}
