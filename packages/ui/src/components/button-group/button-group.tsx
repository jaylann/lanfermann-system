"use client";

import { type ComponentProps, useMemo } from "react";

import { cn } from "@/lib/cn";

import { ButtonGroupContext } from "./button-group-context";
import { type ButtonGroupVariants, buttonGroupVariants } from "./button-group-variants";

/** A group is a set of actions, and a set needs a name. */
type Named =
  | { "aria-label": string; "aria-labelledby"?: undefined }
  | { "aria-labelledby": string; "aria-label"?: undefined };

export type ButtonGroupProps = Omit<ComponentProps<"div">, "aria-label" | "aria-labelledby"> &
  Named &
  Pick<ButtonGroupVariants, "variant"> & {
    /** The size of every key in it. */
    size?: "sm" | "md" | "lg";
    /** In a row (the default) or one over the other. */
    orientation?: "horizontal" | "vertical";
    /** None of its keys can be pressed, and the fitting lies flat. */
    disabled?: boolean;
  };

/**
 * Actions that belong together, as one fitting with several keys: an action and the menu of its
 * other forms ("Senden" and a chevron), two or three steps on the same thing ("Archivieren",
 * "Melden", "Später"), a pair of arrows. The keys share one face, one edge and one shadow, a
 * seam in the edge's colour divides them, and the fitting moves as one part: it lifts under the
 * pointer and goes down under a press, and only the pressed key takes the inner shade, so it
 * rocks on that key.
 *
 * Put `Button`s inside, or a `SelectTrigger`. A key that opens a popup is its trigger rendered
 * as a button (`<MenuTrigger render={<Button iconOnly aria-label="…" />}>`). The keys take the
 * group's `variant` and `size`; their own are not read. Keep the keys direct children.
 *
 * It is for actions. A choice between views, with one of them selected, is a
 * `SegmentedControl`; a field with something beside its text is an `InputGroup`. Name the group
 * (`aria-label`): Tab goes from key to key, and a screen reader says the name on the way in.
 */
export function ButtonGroup({
  variant,
  size = "md",
  orientation = "horizontal",
  disabled = false,
  className,
  ...props
}: ButtonGroupProps) {
  const context = useMemo(() => ({ size, disabled }), [size, disabled]);
  return (
    <ButtonGroupContext value={context}>
      <div
        role="group"
        data-slot="button-group"
        data-variant={variant ?? "secondary"}
        data-size={size}
        data-orientation={orientation}
        data-disabled={disabled ? "" : undefined}
        className={cn(buttonGroupVariants({ variant, size }), className)}
        {...props}
      />
    </ButtonGroupContext>
  );
}
