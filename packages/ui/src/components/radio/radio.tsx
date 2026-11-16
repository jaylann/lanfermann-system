"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { mergeClassName } from "@/lib/cn";

export type RadioGroupProps = RadioGroupPrimitive.Props;

/** One choice out of a few. Lay the options out as rows; label each with a `<label>`. */
export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={mergeClassName("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

export type RadioProps = RadioPrimitive.Root.Props;

/**
 * Ring to disc, the system's signature in its plainest form: an open ring is a possibility, the
 * Indigo disc that seats into it is the choice. The previous choice shrinks away; nothing flies
 * between options.
 */
export function Radio({ className, ...props }: RadioProps) {
  return (
    <RadioPrimitive.Root
      data-slot="radio"
      className={mergeClassName(
        [
          "group touch-target relative inline-flex size-(--check-size) shrink-0 items-center justify-center rounded-full bg-surface depth-socket",
          "transition-[box-shadow,scale] spring-seat active:scale-[0.92] active:spring-snap",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "data-disabled:pointer-events-none data-disabled:bg-disabled data-disabled:depth-flat",
        ],
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-indicator"
        keepMounted
        className="size-(--radio-dot) scale-0 rounded-full bg-accent transition-[scale] spring-leave group-data-checked:scale-100 group-data-checked:spring-seat group-data-disabled:bg-on-disabled forced-colors:bg-[color:CanvasText]"
      />
    </RadioPrimitive.Root>
  );
}
