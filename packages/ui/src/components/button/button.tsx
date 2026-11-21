"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { useButtonGroup } from "@/components/button-group/button-group-context";
import {
  buttonGroupKeyDisabledLook,
  buttonGroupKeyVariants,
} from "@/components/button-group/button-group-variants";
import { Spinner } from "@/components/spinner/spinner";
import { EaseWidth } from "@/internal/ease-width";
import { mergeClassName } from "@/lib/cn";

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
  return (
    <ButtonPrimitive
      data-slot="button"
      data-group-key={group ? "" : undefined}
      data-variant={group ? undefined : resolvedVariant}
      data-size={resolvedSize}
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading || group?.disabled}
      // A loading button stays focusable, so focus is not thrown to <body> mid-action.
      focusableWhenDisabled={focusableWhenDisabled ?? loading}
      className={mergeClassName(
        group
          ? [
              buttonGroupKeyVariants({ size: resolvedSize, iconOnly }),
              !loading && buttonGroupKeyDisabledLook,
            ]
          : [
              buttonVariants({ variant, size, iconOnly }),
              !loading && buttonDisabledLook[resolvedVariant],
            ],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          {/* Still laid out and still the accessible name; only its ink is gone. */}
          <span
            data-slot="button-label"
            className="inline-flex items-center gap-[inherit] opacity-0"
          >
            {label}
          </span>
          <span
            data-slot="button-spinner"
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-150 ease-out starting:opacity-0"
          >
            <Spinner size={spinnerSize[resolvedSize]} />
          </span>
        </>
      ) : (
        label
      )}
    </ButtonPrimitive>
  );
}
