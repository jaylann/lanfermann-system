"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { useMemo } from "react";

import { ButtonGroupContext } from "@/components/button-group/button-group-context";
import { buttonGroupVariants } from "@/components/button-group/button-group-variants";
import { mergeClassName } from "@/lib/cn";

/** A group is a set of keys, and a set needs a name. */
type Named =
  | { "aria-label": string; "aria-labelledby"?: undefined }
  | { "aria-labelledby": string; "aria-label"?: undefined };

export type ToggleGroupProps<Value extends string = string> = Omit<
  ToggleGroupPrimitive.Props<Value>,
  "aria-label" | "aria-labelledby"
> &
  Named & {
    /** The size of every key in it. */
    size?: "sm" | "md" | "lg";
  };

/**
 * Keys that stay down, as one fitting: bold, italic and underlined, or the alignment of a
 * paragraph. It is drawn like a `ButtonGroup` (one face, one edge, one shadow, a seam between
 * two keys), and every key that is on keeps the inner shade of a press.
 *
 * With `multiple` any number of keys may be down at once, each on its own. Without it one key
 * at most is down, and pressing it again lets it up: for a choice that may also be none. A
 * choice between views, where one is always selected, is a `SegmentedControl`.
 *
 * Put `Toggle`s inside, each with a `value`. The value of the group is always a list. Name the
 * group (`aria-label`): Tab reaches it once, and the arrow keys move between its keys.
 */
export function ToggleGroup<Value extends string = string>({
  size = "md",
  disabled = false,
  className,
  ...props
}: ToggleGroupProps<Value>) {
  const context = useMemo(() => ({ size, disabled }), [size, disabled]);
  return (
    <ButtonGroupContext value={context}>
      <ToggleGroupPrimitive<Value>
        data-slot="toggle-group"
        data-variant="secondary"
        data-size={size}
        disabled={disabled}
        className={mergeClassName(buttonGroupVariants({ size }), className)}
        {...props}
      />
    </ButtonGroupContext>
  );
}
