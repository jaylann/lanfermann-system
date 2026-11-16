"use client";

import type { ComponentProps } from "react";

import { Button, type ButtonProps } from "@/components/button/button";
import { fieldShell, fieldShellSize, type FieldSize, focusFieldControl } from "@/internal/field";
import { FieldShellContext } from "@/internal/field-context";
import { cn, mergeClassName } from "@/lib/cn";

export type InputGroupProps = ComponentProps<"div"> & {
  /** The size of the whole field; the `Input` inside follows it. */
  size?: FieldSize;
};

/**
 * A field with something standing beside the text: an icon in front of a search, a unit behind an
 * amount, a button that reveals a password. The group wears the field (edge, halo, invalid and
 * disabled look) and the `Input` inside it goes bare, so the two read as one socket.
 *
 * Put an `InputGroupAddon` or an `InputGroupButton` before or after the `Input`; their place in
 * the markup is their place in the field. Label the `Input` as usual, with a `FieldLabel` or an
 * `aria-label`: an adornment is not a label. If a unit matters for understanding the value, say
 * it in the label too ("Betrag in Euro").
 */
export function InputGroup({
  className,
  size = "md",
  onMouseDown,
  children,
  ...props
}: InputGroupProps) {
  return (
    <FieldShellContext value={true}>
      <div
        data-slot="input-group"
        data-size={size}
        className={cn(fieldShell, fieldShellSize[size], className)}
        // The whole field is the target, as on a plain input: a press on an icon, a unit or the
        // padding lands in the input.
        onMouseDown={(event) => {
          onMouseDown?.(event);
          if (!event.defaultPrevented) focusFieldControl(event);
        }}
        {...props}
      >
        {children}
      </div>
    </FieldShellContext>
  );
}

/**
 * Something to read beside the value: an `Icon`, or a short text such as a unit ("€", "Std.") or
 * a fixed prefix ("https://"). Muted, so the typed value stays the loudest thing in the field.
 * It keeps 8px to the value, which reads as a space; a prefix that runs on into the value closes
 * that with `className="-mr-1.5"`.
 */
export function InputGroupAddon({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-addon"
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap text-fg-muted select-none first:pl-(--field-pad) last:pr-(--field-pad)",
        "group-has-[[data-field-control][data-disabled]]/field:text-on-disabled",
        className,
      )}
      {...props}
    />
  );
}

export type InputGroupButtonProps = Omit<
  Extract<ButtonProps, { iconOnly: true }>,
  "iconOnly" | "variant" | "size"
>;

/**
 * A quiet icon button inside the field: reveal a password, clear the text, open a picker. It sits
 * 3px inside the edge and takes the concentric corner (the field's radius minus that inset). It
 * has no visible label, so it needs an `aria-label`; a toggle also takes `aria-pressed`.
 */
export function InputGroupButton({ className, ...props }: InputGroupButtonProps) {
  return (
    <Button
      iconOnly
      variant="quiet"
      className={mergeClassName(
        [
          "size-[calc(var(--field-height)-6px)] rounded-[calc(var(--field-radius)-3px)] text-fg-muted first:ml-[3px] last:mr-[3px] hover:text-fg",
          // Inside the field there is no room for the usual 2px gap around the outline.
          "focus-visible:outline-offset-0",
        ],
        className,
      )}
      {...props}
      data-slot="input-group-button"
    />
  );
}
