"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { useRef } from "react";

import { useGround } from "@/components/ground/ground";
import { Icon } from "@/components/icon/icon";
import { InputGroupAddon } from "@/components/input-group/input-group";
import { fieldShell, fieldShellSize, type FieldSize, focusFieldControl } from "@/internal/field";
import { FieldShellContext } from "@/internal/field-context";
import {
  DEFAULT_TIME,
  formatTime,
  type HourCycle,
  parseGermanTime,
  timeMatches,
  timesOfDay,
} from "@/internal/iso-date";
import { listChosen, ListMark, useListMarking } from "@/internal/list-mark";
import { listItem, listSheet, popupMotion } from "@/internal/popup";
import { TypedInput, type TypedInputProps, useTypedValue } from "@/internal/typed-input";
import { cn } from "@/lib/cn";

export type TimeFieldProps = Omit<
  TypedInputProps,
  "text" | "onTextChange" | "onCommit" | "formValue" | "problem" | "size" | "min" | "max" | "step"
> & {
  /** Classes for the field as a whole, e.g. its width. */
  className?: string;
  /** The time as `"09:30"`, or `""` for none (controlled). */
  value?: string;
  /** The time at first (uncontrolled). */
  defaultValue?: string;
  /** Reports the time as `"09:30"`, `""` when the field is empty or cannot be read. */
  onValueChange?: (value: string) => void;
  /** The earliest and the latest time that can be chosen, as `"08:00"`. */
  min?: string;
  max?: string;
  /** How many minutes lie between the times offered in the list. Any time can still be typed. */
  step?: number;
  /**
   * The clock the time is written and offered on: 24 hours ("16:30", the default) or 12 with AM
   * and PM ("4:30 PM"). Either way both can be typed, and the value stays `"16:30"`.
   */
  hourCycle?: HourCycle;
  /** Whether the list of times is open at first. */
  defaultOpen?: boolean;
  /** The size of the field, from the density. */
  size?: FieldSize;
};

/**
 * A time of day on its own: "Beginn", "Rückruf ab". For a time on a certain day, use a
 * `DateField` with `time`.
 *
 * It is typed, or picked: a press on the field opens the times of the day, a quarter of an hour
 * apart, and typing narrows them to what the text could become ("9" offers 09:00 to 09:45). Any
 * time can be typed, also one that is not on the list; it is read when the field is left: `9`,
 * `930`, `9:30`, `9.30`, `9 Uhr`, `9 pm` all become a time. On a phone it brings up the digits.
 *
 * `hourCycle={12}` writes and offers the times with AM and PM. The value is `"09:30"` either
 * way: 24 hours, no zone. Inside a `Form`, `name` submits exactly that.
 */
export function TimeField({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 15,
  hourCycle = 24,
  defaultOpen,
  size = "md",
  className,
  disabled,
  readOnly,
  ...props
}: TimeFieldProps) {
  const ground = useGround();
  const { marking } = useListMarking();
  const list = useRef<HTMLDivElement>(null);
  const written = (time: string) => formatTime(time, hourCycle);
  const typed = useTypedValue({
    value,
    defaultValue,
    onValueChange,
    show: (time) => formatTime(time, hourCycle),
    read: (text) => {
      const time = parseGermanTime(text);
      if (!time) {
        return { problem: `Bitte geben Sie eine Uhrzeit ein, zum Beispiel ${written("09:30")}.` };
      }
      if ((!min || time >= min) && (!max || time <= max)) return time;
      if (min && max) {
        return {
          problem: `Bitte wählen Sie eine Uhrzeit zwischen ${written(min)} und ${written(max)}.`,
        };
      }
      return {
        problem: min
          ? `Bitte wählen Sie eine Uhrzeit ab ${written(min)}.`
          : `Bitte wählen Sie eine Uhrzeit bis ${written(max!)}.`,
      };
    },
  });

  return (
    <Autocomplete.Root
      items={timesOfDay(step, min, max)}
      itemToStringValue={written}
      value={typed.text}
      onValueChange={(text, details) => {
        // Escape with the list closed would empty the field (a search box's habit). A time is
        // not a search: it stays, and Escape goes on to close what the field stands in.
        if (details.reason === "escape-key") return;
        // A time taken from the list is the value at once; typed text is read when typing ends.
        const taken = details.reason === "item-press" ? parseGermanTime(text) : undefined;
        if (taken) typed.set(taken);
        else typed.setText(text);
      }}
      // While the field still shows its time untouched, every time is on offer: it is opened
      // to pick another, not to find the one it has.
      filter={(time: string, query) =>
        query === written(typed.value) || timeMatches(time, query, hourCycle)
      }
      openOnInputClick
      defaultOpen={defaultOpen}
      disabled={disabled}
      // Read-only, the list can still be looked through; nothing on it can be taken.
      readOnly={readOnly}
      onOpenChangeComplete={(open) => {
        const box = list.current;
        if (!open || !box) return;
        // Opened with every time on offer, the list starts where the time is, or at the start
        // of a working day: not at midnight.
        const from = parseGermanTime(typed.text) || typed.value || DEFAULT_TIME;
        const rows = [...box.querySelectorAll<HTMLElement>("[data-time]")];
        const row = rows.find((time) => (time.dataset.time ?? "") >= from) ?? rows.at(-1);
        if (!row) return;
        // The list is moved, not `scrollIntoView`: that would move the page under it as well.
        const away = row.getBoundingClientRect().top - box.getBoundingClientRect().top;
        box.scrollTop += away - (box.clientHeight - row.offsetHeight) / 2;
      }}
    >
      <FieldShellContext value={true}>
        <Autocomplete.InputGroup
          data-slot="time-field"
          data-size={size}
          className={cn(fieldShell, fieldShellSize[size], className)}
          onMouseDown={focusFieldControl}
        >
          <Autocomplete.Input
            render={
              <TypedInput
                inputMode="numeric"
                placeholder={`z. B. ${written("09:30")}`}
                text={typed.text}
                onTextChange={typed.setText}
                onCommit={typed.commit}
                formValue={typed.value}
                problem={typed.problem}
                readOnly={readOnly}
                className="tabular-nums"
                {...props}
                data-slot="time-field-input"
              />
            }
          />
          <InputGroupAddon>
            <Icon icon={Clock01Icon} size={size === "sm" ? 14 : 16} />
          </InputGroupAddon>
        </Autocomplete.InputGroup>
      </FieldShellContext>

      <Autocomplete.Portal>
        <Autocomplete.Positioner
          data-slot="time-field-positioner"
          side="bottom"
          align="start"
          sideOffset={6}
          // Nothing on the list for what was typed (a time between two of its steps): no sheet.
          className="z-50 outline-none data-empty:hidden"
        >
          <Autocomplete.Popup
            data-slot="time-field-list"
            data-theme={ground}
            className={cn(listSheet, popupMotion, "min-w-(--anchor-width)")}
          >
            <Autocomplete.List
              ref={list}
              aria-label="Uhrzeiten"
              className="max-h-[min(15rem,calc(var(--available-height)-0.5rem))] scroll-py-1 overflow-y-auto overscroll-contain outline-none"
            >
              {(time: string) => (
                <Autocomplete.Item
                  key={time}
                  value={time}
                  data-slot="time-field-option"
                  data-time={time}
                  data-chosen={time === typed.value ? "" : undefined}
                  className={cn("group", listItem, listChosen[marking], "tabular-nums")}
                >
                  {written(time)}
                  {/* As in a select: the time the field holds carries the mark at the right. */}
                  <ListMark on={time === typed.value} className="ml-auto" />
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
