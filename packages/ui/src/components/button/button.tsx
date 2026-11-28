"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { useEffect, useState } from "react";

import { useButtonGroup } from "@/components/button-group/button-group-context";
import {
  buttonGroupKeyDisabledLook,
  buttonGroupKeyVariants,
} from "@/components/button-group/button-group-variants";
import { Spinner } from "@/components/spinner/spinner";
import { EaseWidth } from "@/internal/ease-width";
import { TickGlyph } from "@/internal/glyphs";
import { cn, mergeClassName } from "@/lib/cn";

import { buttonDisabledLook, type ButtonVariants, buttonVariants } from "./button-variants";

const spinnerSize = { sm: 14, md: 16, lg: 18 } as const;

export type ButtonProps = ButtonPrimitive.Props &
  Pick<ButtonVariants, "variant" | "size"> & {
    /**
     * The action is under way: a spinner replaces the label, the width stays, and the button
     * cannot be pressed again. It keeps focus and its colour.
     */
    loading?: boolean;
    /**
     * What was asked for went through: a tick is drawn in the label's place, the width stays, and
     * the button cannot be pressed until it is turned off again. Shown briefly, after `loading`,
     * by the app that knows the moment; the words for assistive tech are the app's to say.
     */
    done?: boolean;
    /**
     * The label changes while the button is on screen („Vorjahr zeigen“, then „Dieses Jahr
     * zeigen“): the button eases to its new width instead of jumping, and what stands beside it
     * moves along. Off by default; most labels never change.
     */
    resize?: boolean;
  } & (
    | {
        /** A square button for a single icon. It has no visible label, so it needs a name. */
        iconOnly: true;
        "aria-label": string;
      }
    | { iconOnly?: false }
  );

/**
 * A fitting: the one thing in the system that is pressed. It sits raised on a soft shadow under a
 * gloss, goes down on pointer-down (`snap`) and seats back with a small bounce on release
 * (`seat`). Heights and paddings come from the density (src/styles/density.css).
 *
 * Label it with what happens ("Angebot senden", not "OK"). Icons go inside as children, before
 * the label: 14px in `sm`, 16px in `md`, 18px in `lg`. For a link that should look like a button,
 * style an `<a>` with `buttonVariants()` instead of rendering one through `Button`.
 *
 * Inside a `ButtonGroup` it is one key of the group's fitting: it has no face of its own and
 * takes the group's size, and its `variant` is not read.
 */
export function Button({
  className,
  variant,
  size,
  iconOnly,
  loading = false,
  done = false,
  resize = false,
  disabled,
  focusableWhenDisabled,
  children,
  ...props
}: ButtonProps) {
  const group = useButtonGroup();
  const resolvedVariant = variant ?? "secondary";
  const resolvedSize = group?.size ?? size ?? "md";
  const label = resize && !iconOnly ? <EaseWidth>{children}</EaseWidth> : children;
  const busy = loading || done;
  const layered = useStateLayer(busy);
  return (
    <ButtonPrimitive
      data-slot="button"
      data-group-key={group ? "" : undefined}
      data-variant={group ? undefined : resolvedVariant}
      data-size={resolvedSize}
      data-loading={loading ? "" : undefined}
      data-done={done ? "" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || busy || group?.disabled}
      // A busy button stays focusable, so focus is not thrown to <body> mid-action.
      focusableWhenDisabled={focusableWhenDisabled ?? busy}
      className={mergeClassName(
        group
          ? [
              buttonGroupKeyVariants({ size: resolvedSize, iconOnly }),
              !busy && buttonGroupKeyDisabledLook,
            ]
          : [
              buttonVariants({ variant, size, iconOnly }),
              !busy && buttonDisabledLook[resolvedVariant],
            ],
        className,
      )}
      {...props}
    >
      {layered ? (
        <>
          {/* Still laid out and still the accessible name while busy; only its ink is gone. It
              sinks away fast and seats back with the button's release bounce. */}
          <span
            data-slot="button-label"
            className={cn(
              "inline-flex items-center gap-[inherit] transition-[opacity,scale] spring-seat motion-reduce:scale-100",
              busy && "scale-92 opacity-0 spring-snap starting:scale-100 starting:opacity-100",
            )}
          >
            {label}
          </span>
          <span
            aria-hidden
            data-slot="button-state"
            className="pointer-events-none absolute inset-0 grid place-items-center *:col-start-1 *:row-start-1"
          >
            <span
              data-slot="button-spinner"
              className={cn(
                "flex scale-80 opacity-0 transition-[opacity,scale] spring-leave motion-reduce:scale-100",
                loading &&
                  "scale-100 opacity-100 spring-settle starting:scale-80 starting:opacity-0 motion-reduce:starting:scale-100",
              )}
            >
              <Spinner size={spinnerSize[resolvedSize]} />
            </span>
            <TickGlyph
              data-slot="button-tick"
              width={spinnerSize[resolvedSize]}
              height={spinnerSize[resolvedSize]}
              strokeWidth={21 / spinnerSize[resolvedSize]}
            />
          </span>
        </>
      ) : (
        label
      )}
    </ButtonPrimitive>
  );
}

/** How long the spinner and the tick take to fade once a button is no longer busy, in ms. */
const STATE_LEAVE_MS = 200;

/**
 * Whether the layer over the label (spinner and tick) is drawn: while the button is busy, and for
 * the moment its marks take to fade after, so ending `loading` fades the spinner out and seats
 * the label back instead of cutting. At rest it is not drawn: most buttons never need it.
 */
function useStateLayer(busy: boolean) {
  const [lingering, setLingering] = useState(false);
  const [wasBusy, setWasBusy] = useState(busy);
  if (busy !== wasBusy) {
    setWasBusy(busy);
    setLingering(!busy);
  }
  useEffect(() => {
    if (!lingering) return;
    const timer = setTimeout(() => setLingering(false), STATE_LEAVE_MS);
    return () => clearTimeout(timer);
  }, [lingering]);
  return busy || lingering;
}
