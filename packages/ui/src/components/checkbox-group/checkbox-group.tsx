"use client";

import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group";
import type { ComponentProps } from "react";

import { cn, mergeClassName } from "@/lib/cn";

export type CheckboxGroupProps = CheckboxGroupPrimitive.Props;

/**
 * Several of a few: the services of a quote, the days a shop is open. The value is the list of
 * the ticked checkboxes' `value`s. Lay the options out as rows, each `Checkbox` in a `<label>`
 * with its text, and name the group with a `FieldsetLegend` or `aria-labelledby`.
 *
 * For "select all", pass every option as `allValues`, control the group, and give the first
 * `Checkbox` the `parent` prop: it shows the dash while some, not all, are ticked. Indent the
 * options under it with `CheckboxGroupItems`.
 */
export function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  return (
    <CheckboxGroupPrimitive
      data-slot="checkbox-group"
      className={mergeClassName("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

/**
 * The options that a parent checkbox stands for, set in by the width of a box and its gap, so
 * their boxes start where the parent's text does.
 */
export function CheckboxGroupItems({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="checkbox-group-items"
      className={cn("flex flex-col gap-3 pl-[calc(var(--check-size)+0.625rem)]", className)}
      {...props}
    />
  );
}
