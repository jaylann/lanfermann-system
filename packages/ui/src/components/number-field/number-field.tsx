"use client";

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";

import {
  bareControl,
  fieldShell,
  fieldShellSize,
  type FieldSize,
  focusFieldControl,
} from "@/internal/field";
import { MinusGlyph, PlusGlyph } from "@/internal/glyphs";
import { cn, mergeClassName } from "@/lib/cn";

export type NumberFieldProps = NumberFieldPrimitive.Root.Props & {
  /** The size of the field, from the density. */
  size?: FieldSize;
};

/**
 * A field for a number: a price, a quantity, a share. It formats what was typed when the field
 * is left, steps with the arrow keys (Shift for ten, Alt for a tenth) and keeps the value a
 * `number`, never a string to parse.
 *
 * Put a `NumberFieldInput` inside. Around it go, as needed, an `InputGroupAddon` for a unit that
 * Intl cannot format ("Std.", "Stück") and the two steppers: `NumberFieldDecrement` before the
 * input, `NumberFieldIncrement` after it. Currency and percent come from
 * `format`, which puts the sign into the text: `format={{ style: "currency", currency: "EUR" }}`.
 *
 * Always pass `locale` (`"de-DE"`): without it the field formats in the locale of whatever runs
 * it, and the server's is not the browser's.
 */
export function NumberField({ className, size = "md", children, ...props }: NumberFieldProps) {
  return (
    <NumberFieldPrimitive.Root
      data-slot="number-field"
      data-size={size}
      // `relative`, so the browser's own validation bubble points at the field.
      className={mergeClassName("relative w-full min-w-0", className)}
      {...props}
    >
      <NumberFieldPrimitive.Group
        data-slot="number-field-group"
        className={cn(fieldShell, fieldShellSize[size])}
        onMouseDown={focusFieldControl}
      >
        {children}
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  );
}

/**
 * The typed value: set right, in tabular digits, so amounts line up from field to field. Between
 * two steppers it is centred instead.
 */
export function NumberFieldInput({ className, ...props }: NumberFieldPrimitive.Input.Props) {
  return (
    <NumberFieldPrimitive.Input
      data-slot="number-field-input"
      data-field-control=""
      // What a screen reader says the field is. Base UI's own word is English ("Number field").
      aria-roledescription="Zahlenfeld"
      className={mergeClassName(
        [
          bareControl,
          "text-right tabular-nums",
          "group-has-[[data-slot=number-field-decrement]:first-child]/field:text-center",
        ],
        className,
      )}
      {...props}
    />
  );
}

/**
 * A stepper is a quiet segment of the field, divided from its neighbour by a hairline. The glyph
 * dips when pressed and seats back (`seat`); holding the button repeats the step.
 */
const stepper = [
  "relative flex h-full w-[calc(var(--field-height)-4px)] shrink-0 items-center justify-center border-hairline text-fg-muted select-none first:rounded-l-[inherit] first:border-r not-first:border-l last:rounded-r-[inherit] touch-target",
  "hover:bg-hover hover:text-fg active:bg-hover",
  "[&>svg]:transition-[scale] [&>svg]:spring-seat active:[&>svg]:scale-[0.82] active:[&>svg]:spring-snap motion-reduce:active:[&>svg]:scale-100",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
  "data-disabled:pointer-events-none data-disabled:text-on-disabled",
].join(" ");

/**
 * Steps the value down. Steppers are an option, for small counts that are stepped more often
 * than typed (a quantity); an amount of money does not get them.
 */
export function NumberFieldDecrement({
  className,
  children,
  ...props
}: NumberFieldPrimitive.Decrement.Props) {
  return (
    <NumberFieldPrimitive.Decrement
      data-slot="number-field-decrement"
      aria-label="Verringern"
      className={mergeClassName(stepper, className)}
      {...props}
    >
      {children ?? <MinusGlyph />}
    </NumberFieldPrimitive.Decrement>
  );
}

/** Steps the value up. See `NumberFieldDecrement`. */
export function NumberFieldIncrement({
  className,
  children,
  ...props
}: NumberFieldPrimitive.Increment.Props) {
  return (
    <NumberFieldPrimitive.Increment
      data-slot="number-field-increment"
      aria-label="Erhöhen"
      className={mergeClassName(stepper, className)}
      {...props}
    >
      {children ?? <PlusGlyph />}
    </NumberFieldPrimitive.Increment>
  );
}
