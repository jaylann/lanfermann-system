"use client";

import { OTPField as OTPFieldPrimitive } from "@base-ui/react/otp-field";
import { type CSSProperties, Fragment, useEffect, useRef, useState } from "react";

import { fieldFace } from "@/internal/field";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";

/** How long a halo takes to open (`snap`), after which it hops between slots at once. */
const ENTERED_MS = 140;
/** How long the slots count as filled in one go, so the digits of a paste seat one by one. */
const BURST_MS = 480;

export type OtpFieldProps = Omit<
  OTPFieldPrimitive.Root.Props,
  "children" | "className" | "length" | "render"
> & {
  /** How many characters the code has. Six unless said otherwise. */
  length?: number;
  /**
   * How many slots stand together before a short line sets the next ones apart: 3 writes six
   * digits as "123 456", the way a code is read out. 0 keeps them in one row.
   */
  groupSize?: number;
  /**
   * `joined` (the default): the slots of a group share one socket, divided by hairlines.
   * `separate`: every slot is a socket of its own.
   */
  variant?: "joined" | "separate";
  /**
   * The slots share the width of the field's place instead of keeping their own: for a dialog
   * or a narrow card, where six small slots would leave half the line empty.
   */
  fill?: boolean;
  /** What a slot after the first is called for assistive tech: "Ziffer 2 von 6". */
  slotLabel?: (position: number, length: number) => string;
  className?: string;
};

/** A slot that is a socket of its own. */
const separateSlot = [
  "rounded-md",
  fieldFace,
  "has-[input:focus]:depth-field-focus",
  // Six halos side by side would be one red band: every slot takes the danger edge, and only
  // the one being typed opens the halo.
  "has-[input[data-invalid]]:depth-field-invalid has-[input[data-invalid]:focus]:depth-field-invalid",
  "has-[input[data-invalid]:not(:focus)]:[--depth-field-halo-danger:transparent]",
  "has-[input[data-disabled]]:bg-disabled has-[input[data-disabled]]:depth-flat",
].join(" ");

/** The socket that the slots of a group share. */
const joinedGroup = [
  "rounded-md bg-surface depth-field",
  "has-[input[data-invalid]]:depth-field-invalid",
  "has-[input[data-disabled]]:bg-disabled has-[input[data-disabled]]:depth-flat",
].join(" ");

/** A slot inside that socket: a hairline to its left, and the halo is its own. */
const joinedSlot = [
  "border-hairline not-first:border-l first:rounded-l-md last:rounded-r-md",
  "transition-[box-shadow] spring-snap has-[input:focus]:z-1 has-[input:focus]:shadow-field-focus",
  "has-[input[data-invalid]:focus]:shadow-field-invalid",
].join(" ");

/**
 * A one-time code: the six digits from a text message or an authenticator app. Every character
 * has a slot, in threes, the way a code is read out. The slot that is being typed wears the
 * field's halo, and a digit seats into its slot as it arrives. A pasted code, or one the phone
 * offers from a message, fills every slot.
 *
 * Label it with a `FieldLabel` in a `Field` ("Bestätigungscode") and say in a
 * `FieldDescription` where the code was sent. A wrong code is said in words under the field
 * (`FieldError`); the field does not shake. `onValueComplete` tells when the last slot is
 * filled, `autoSubmit` sends the form then.
 *
 * It takes digits. `validationType="alphanumeric"` lets letters in, for a recovery code.
 */
export function OtpField({
  length = 6,
  groupSize = 3,
  variant = "joined",
  fill = false,
  mask = false,
  slotLabel = (position, total) => `Ziffer ${position} von ${total}`,
  className,
  onValueChange,
  onFocus,
  onBlur,
  ...props
}: OtpFieldProps) {
  // Page load does not animate: a code that is there when the field first shows stands still.
  const live = useLive();

  // The halo opens with the field and then hops from slot to slot at once: typing does not
  // wait for a transition.
  const [entered, setEntered] = useState(false);
  const entering = useRef<ReturnType<typeof setTimeout>>(undefined);

  // More than one character at once is a paste or a code offered by the phone: its digits seat
  // one after the other. A digit that is typed seats at once.
  const [burst, setBurst] = useState(false);
  const bursting = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastLength = useRef((props.value ?? props.defaultValue ?? "").length);

  useEffect(
    () => () => {
      clearTimeout(entering.current);
      clearTimeout(bursting.current);
    },
    [],
  );

  const groups: number[][] = [];
  for (let index = 0; index < length; index++) {
    const group = groupSize > 0 ? Math.floor(index / groupSize) : 0;
    (groups[group] ??= []).push(index);
  }

  return (
    <OTPFieldPrimitive.Root
      data-slot="otp-field"
      data-variant={variant}
      data-live={live ? "" : undefined}
      data-entered={entered ? "" : undefined}
      data-burst={burst ? "" : undefined}
      length={length}
      mask={mask}
      data-fill={fill ? "" : undefined}
      className={cn(
        "group/otp items-center gap-2",
        fill ? "flex w-full" : "inline-flex w-fit",
        className,
      )}
      onValueChange={(value, details) => {
        if (value.length - lastLength.current > 1) {
          clearTimeout(bursting.current);
          setBurst(true);
          bursting.current = setTimeout(() => setBurst(false), BURST_MS);
        }
        lastLength.current = value.length;
        onValueChange?.(value, details);
      }}
      onFocus={(event) => {
        clearTimeout(entering.current);
        entering.current = setTimeout(() => setEntered(true), ENTERED_MS);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          clearTimeout(entering.current);
          setEntered(false);
        }
        onBlur?.(event);
      }}
      {...props}
    >
      {groups.map((slots, group) => (
        // The groups never change places, so their position is their key.
        <Fragment key={slots[0]}>
          {group > 0 && (
            <OTPFieldPrimitive.Separator
              data-slot="otp-field-separator"
              className="h-px w-2 shrink-0 bg-line forced-colors:bg-[CanvasText]"
            />
          )}
          <span
            data-slot="otp-field-group"
            className={cn(
              "flex",
              variant === "joined" ? joinedGroup : "gap-1.5",
              fill && "min-w-0 flex-1",
            )}
          >
            {slots.map((index) => (
              <OTPFieldPrimitive.Input
                key={index}
                // The first slot takes the field's label; the others say where they stand.
                aria-label={index === 0 ? undefined : slotLabel(index + 1, length)}
                render={(inputProps, state) => (
                  <span
                    data-slot="otp-field-slot"
                    data-filled={state.filled ? "" : undefined}
                    style={{ "--slot": index } as CSSProperties}
                    className={cn(
                      "relative inline-grid h-(--control-lg) place-items-center",
                      fill ? "min-w-0 flex-1" : "w-(--control-lg)",
                      variant === "joined" ? joinedSlot : separateSlot,
                      "group-data-entered/otp:transition-none",
                    )}
                  >
                    {/* The input takes the typing; its own text is not shown, the digit over it
                        is, because only an element of its own can seat in. */}
                    <input
                      {...inputProps}
                      data-slot="otp-field-input"
                      className="absolute inset-0 size-full rounded-[inherit] bg-transparent text-center text-lg text-transparent caret-accent selection:bg-transparent focus:outline-hidden forced-colors:text-[FieldText]"
                    />
                    {state.value !== "" && (
                      <span
                        aria-hidden
                        key={state.value}
                        data-slot="otp-field-digit"
                        className={cn(
                          "pointer-events-none relative text-lg font-medium text-fg tabular-nums forced-colors:hidden",
                          "group-has-[input[data-disabled]]/otp:text-on-disabled",
                          // Readable from its first frame; what springs is the seating.
                          "transition-[scale,opacity] spring-seat in-data-live:starting:scale-90 in-data-live:starting:opacity-40",
                          // One after the other when they arrive together.
                          "in-data-burst:delay-[calc(var(--slot)*35ms)] in-data-burst:in-data-live:starting:opacity-0",
                          mask && "size-2 rounded-full bg-current",
                        )}
                      >
                        {mask ? null : state.value}
                      </span>
                    )}
                  </span>
                )}
              />
            ))}
          </span>
        </Fragment>
      ))}
    </OTPFieldPrimitive.Root>
  );
}
