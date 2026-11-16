"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { DashGlyph, TickGlyph } from "@/internal/glyphs";
import { mergeClassName } from "@/lib/cn";

export type CheckboxProps = CheckboxPrimitive.Root.Props;

/**
 * A socket that takes a plug. Unchecked it is an empty, shaded pocket; checked, an Indigo plug
 * seats into it (`seat`) and the tick draws itself.
 *
 * Wrap it in a `<label>` together with its text, or put it in a `Field` with a `FieldLabel`.
 */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={mergeClassName(
        [
          "group touch-target relative inline-flex size-(--check-size) shrink-0 items-center justify-center rounded-xs bg-surface text-on-accent depth-socket",
          "transition-[box-shadow,background-color,scale] spring-seat active:scale-[0.92] active:spring-snap",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "data-checked:bg-accent data-checked:depth-plug data-checked:depth-tone-accent",
          "data-indeterminate:bg-accent data-indeterminate:depth-plug data-indeterminate:depth-tone-accent",
          "data-disabled:pointer-events-none data-disabled:bg-disabled data-disabled:depth-flat data-disabled:text-on-disabled",
        ],
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        keepMounted
        className="flex items-center justify-center"
      >
        {/* The tick draws in (short leg first) and simply fades out: an exit never performs. */}
        <TickGlyph className="opacity-0 transition-[stroke-dashoffset,opacity] duration-150 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] group-data-checked:opacity-100 group-data-checked:[stroke-dashoffset:0] group-data-indeterminate:hidden" />
        <DashGlyph className="hidden group-data-indeterminate:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
