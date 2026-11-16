"use client";

import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";

import { mergeClassName } from "@/lib/cn";

/**
 * One label over several controls: an address, a group of checkboxes, the options of a plan. For
 * a radio or checkbox group inside a `Field`, pass the group as `render`.
 */
export function Fieldset({ className, ...props }: FieldsetPrimitive.Root.Props) {
  return (
    <FieldsetPrimitive.Root
      data-slot="fieldset"
      className={mergeClassName("flex min-w-0 flex-col gap-4", className)}
      {...props}
    />
  );
}

/** Names the group, in sentence case. It reads as the heading of the fields below it. */
export function FieldsetLegend({ className, ...props }: FieldsetPrimitive.Legend.Props) {
  return (
    <FieldsetPrimitive.Legend
      data-slot="fieldset-legend"
      className={mergeClassName(
        "text-base font-semibold text-fg data-disabled:text-on-disabled",
        className,
      )}
      {...props}
    />
  );
}
