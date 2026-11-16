"use client";

import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { type ReactNode, type RefObject, useContext, useRef } from "react";

import { Button } from "@/components/button/button";
import { Field, FieldLabel } from "@/components/field/field";
import { Icon } from "@/components/icon/icon";
import { InputGroupButton } from "@/components/input-group/input-group";
import { PopoverClose, PopoverContent, PopoverTrigger } from "@/components/popover/popover";
import { TimeField, type TimeFieldProps } from "@/components/time-field/time-field";
import type { FieldSize } from "@/internal/field";
import { FieldDisabledContext } from "@/internal/field-context";

/**
 * The button at the end of a date field that opens its calendar. A field that cannot be changed
 * (disabled, by itself or through its `Field`, or read-only) does not open one.
 */
export function PickerButton({ size, disabled }: { size?: FieldSize; disabled?: boolean }) {
  const off = useContext(FieldDisabledContext) || disabled;
  return (
    <PopoverTrigger
      render={
        <InputGroupButton aria-label="Kalender öffnen" disabled={off}>
          <Icon icon={Calendar03Icon} size={size === "sm" ? 14 : 16} />
        </InputGroupButton>
      }
    />
  );
}

/**
 * The sheet a date field opens: its calendar and, with times, the boxes for them. It hangs
 * from the whole field, opens with the focus on the chosen day (or today), so the arrows move
 * from where the date is, and with `done` it carries a button to close it: a sheet that stays
 * open after a day was picked needs one, most of all on a phone.
 */
export function PickerSheet({
  anchor,
  label,
  done = false,
  children,
}: {
  anchor: RefObject<HTMLElement | null>;
  /** Names the sheet for assistive tech: "Datum wählen". */
  label: string;
  done?: boolean;
  children: ReactNode;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  return (
    <PopoverContent
      anchor={anchor}
      align="start"
      sideOffset={6}
      aria-label={label}
      className="w-auto p-3"
      ref={sheet}
      initialFocus={() =>
        sheet.current?.querySelector<HTMLElement>('[data-slot="calendar-day"][tabindex="0"]') ??
        true
      }
    >
      {children}
      {done && (
        <PopoverClose
          render={
            <Button size="sm" variant="primary" className="self-end">
              Fertig
            </Button>
          }
        />
      )}
    </PopoverContent>
  );
}

/**
 * A time under the calendar: its name and a small `TimeField`, typed or picked like any other.
 *
 * It stands in a `Field` of its own. The sheet is a popup of the date field, and without that
 * the time's control would join the date's field and take over its label.
 */
export function PickerTime({
  label,
  hourCycle,
  ...props
}: Pick<TimeFieldProps, "value" | "onValueChange" | "hourCycle" | "onKeyDown"> & {
  /** Names the time: "Uhrzeit", "Von", "bis". */
  label: string;
}) {
  return (
    <Field className="flex-row items-center gap-2">
      <FieldLabel className="font-normal text-fg-body">{label}</FieldLabel>
      <TimeField
        size="sm"
        hourCycle={hourCycle}
        className={hourCycle === 12 ? "w-[6.75rem]" : "w-[5.5rem]"}
        {...props}
      />
    </Field>
  );
}

/** The row under the calendar that holds the times, set off by a hairline. */
export const pickerRow =
  "flex items-center justify-between gap-3 border-t border-hairline pt-3 text-control text-fg-body";
