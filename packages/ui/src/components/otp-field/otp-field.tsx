"use client";

import { OTPField as OTPFieldPrimitive } from "@base-ui/react/otp-field";
import { type CSSProperties, Fragment, useEffect, useRef, useState } from "react";

import { fieldFace } from "@/internal/field";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

/**
 * In separate slots, how long a slot's own halo takes to open (`snap`), after which it hops
 * between them at once. A joined field's one halo glides instead (`otp-field-halo`).
 */
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

/**
 * The socket that the slots of a group share. Invalid, it takes the danger edge without the
 * halo, as the separate slots do: only the slot being typed opens one.
 */
const joinedGroup = [
  "rounded-md bg-surface depth-field",
  "has-[input[data-invalid]]:[--depth-field-edge:var(--lf-danger)]",
  "has-[input[data-disabled]]:bg-disabled has-[input[data-disabled]]:depth-flat",
].join(" ");

/** A slot inside that socket: a hairline to its left. The halo is the field's own piece. */
const joinedSlot = "border-hairline not-first:border-l first:rounded-l-md last:rounded-r-md";

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
  slotLabel,
  className,
  onValueChange,
  onFocus,
  onBlur,
  ...props
}: OtpFieldProps) {
  const { messages } = useLocale();
  // Page load does not animate: a code that is there when the field first shows stands still.
  const live = useLive();

  // Separate slots: the halo opens with the field and then hops from slot to slot at once, as
  // each slot draws its own.
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

  // The halo of a joined field: one rounded piece that stands on the slot being typed and
  // glides to the next on `snap`, so it is there before the next digit is (Justin, 2026-11-20,
  // over the slower `glide` and over standing on the next slot at once). Placed from the slot's
  // measured offsets, written as numbers of layout pixels (made lengths where they are used, so
  // zoom cannot set them off), and moved by `translate`.
  const halo = useRef<HTMLSpanElement>(null);
  const joined = variant === "joined";
  const placeHalo = (slot: HTMLElement | null, arriving: boolean) => {
    const piece = halo.current;
    if (!piece || !slot) return;
    // Coming from outside the field it stands on its slot at once; only a move between slots
    // travels.
    if (arriving) piece.dataset.instant = "";
    piece.style.setProperty("--halo-x", String(slot.offsetLeft));
    piece.style.setProperty("--halo-y", String(slot.offsetTop));
    piece.style.setProperty("--halo-w", String(slot.offsetWidth));
    piece.style.setProperty("--halo-h", String(slot.offsetHeight));
    piece.dataset.shown = "";
    if (arriving) requestAnimationFrame(() => delete piece.dataset.instant);
  };
  const slotOf = (target: EventTarget | null) =>
    target instanceof HTMLElement
      ? target.closest<HTMLElement>('[data-slot="otp-field-slot"]')
      : null;
  // A layout that changes (a filled field resized with its dialog) takes the halo along.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = root.current;
    if (!joined || !box) return;
    const observer = new ResizeObserver(() => {
      if (halo.current?.dataset.shown === undefined) return;
      placeHalo(slotOf(document.activeElement), true);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [joined]);

  const groups: number[][] = [];
  for (let index = 0; index < length; index++) {
    const group = groupSize > 0 ? Math.floor(index / groupSize) : 0;
    (groups[group] ??= []).push(index);
  }

  return (
    <OTPFieldPrimitive.Root
      ref={root}
      data-slot="otp-field"
      data-variant={variant}
      data-live={live ? "" : undefined}
      data-entered={entered ? "" : undefined}
      data-burst={burst ? "" : undefined}
      length={length}
      mask={mask}
      data-fill={fill ? "" : undefined}
      className={cn(
        "group/otp relative items-center gap-2",
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
        if (joined) {
          const from = event.relatedTarget;
          placeHalo(
            slotOf(event.target),
            !(from instanceof Node && event.currentTarget.contains(from)),
          );
        }
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          clearTimeout(entering.current);
          setEntered(false);
          if (halo.current) delete halo.current.dataset.shown;
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
                aria-label={
                  index === 0 ? undefined : (slotLabel ?? messages.otpField.slot)(index + 1, length)
                }
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
      {joined && (
        <span
          ref={halo}
          aria-hidden
          data-slot="otp-field-halo"
          className={cn(
            "pointer-events-none absolute top-0 left-0 z-1 rounded-md opacity-0 shadow-field-focus",
            "h-[calc(var(--halo-h,0)*1px)] w-[calc(var(--halo-w,0)*1px)]",
            "[translate:calc(var(--halo-x,0)*1px)_calc(var(--halo-y,0)*1px)]",
            "group-has-[input[data-invalid]]/otp:shadow-field-invalid",
            // The way between slots, and coming and going with the focus, on `snap`.
            "[transition:translate_var(--transition-duration-spring-snap)_var(--ease-spring-snap),opacity_var(--transition-duration-spring-snap)_var(--ease-spring-snap)]",
            "data-instant:[transition:opacity_var(--transition-duration-spring-snap)_var(--ease-spring-snap)]",
            "motion-reduce:[transition:opacity_var(--transition-duration-spring-snap)_var(--ease-spring-snap)]",
            "data-shown:opacity-100",
            // Forced colours drop shadows: the slot being typed is outlined by its own input.
            "forced-colors:hidden",
          )}
        />
      )}
    </OTPFieldPrimitive.Root>
  );
}
