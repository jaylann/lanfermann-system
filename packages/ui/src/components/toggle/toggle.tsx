"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar";

import { Button, type ButtonProps } from "@/components/button/button";
import { useButtonGroup } from "@/components/button-group/button-group-context";
import { useInToolbar } from "@/components/toolbar/toolbar-context";
import { cn } from "@/lib/cn";

/**
 * How a key shows that it is on. A key of a group keeps the inner shade of a press, so the
 * fitting stays rocked on it. A raised key on its own stays down: the pressed recipe without
 * the scale, since it has come to rest. A quiet key keeps the wash it has under the pointer and
 * its symbol stays dark; off, the symbol is muted and only darkens under the pointer.
 */
const pressedLook = {
  key: "data-pressed:bg-(--key-pressed) data-pressed:inset-shadow-pressed",
  secondary: [
    "data-pressed:bg-raised-pressed data-pressed:depth-pressed data-pressed:hover:depth-pressed",
    // Disabled and down: flat like every disabled key, and the inner shade still says "on".
    "data-disabled:data-pressed:bg-disabled data-disabled:data-pressed:depth-flat data-disabled:data-pressed:inset-shadow-pressed",
  ].join(" "),
  quiet: "text-fg-muted hover:text-fg data-pressed:bg-hover data-pressed:text-fg",
} as const;

export type ToggleProps<Value extends string = string> = Omit<
  TogglePrimitive.Props<Value>,
  "className" | "render"
> &
  Pick<ButtonProps, "size"> & {
    /** `secondary` (the default): a raised key. `quiet`: no face, for a toolbar. */
    variant?: "secondary" | "quiet";
    className?: string;
  } & (
    | {
        /** A square key for a single symbol. It has no visible label, so it needs a name. */
        iconOnly: true;
        "aria-label": string;
      }
    | { iconOnly?: false }
  );

/**
 * A key that stays down: bold, a pinned row, a filter that is on. It is a button with two
 * states and says which one it is in (`aria-pressed`). Pressed, it stays down; pressed again,
 * it seats back.
 *
 * Its name does not change with its state: "Fett", not "Fett ausschalten". For a setting with
 * a label beside it, a `Switch` reads better; for one choice out of a few views, a
 * `SegmentedControl`. Several toggles that belong together go into a `ToggleGroup`, where each
 * needs a `value`. In a `Toolbar` it joins the bar's one tab stop by itself.
 */
export function Toggle<Value extends string = string>({
  variant = "secondary",
  size,
  iconOnly,
  className,
  children,
  ...props
}: ToggleProps<Value>) {
  const group = useButtonGroup();
  const inToolbar = useInToolbar();
  const look = cn(group ? pressedLook.key : pressedLook[variant], className);
  // The name of a square key is checked on this component's own props, and reaches the button
  // with the rest of them.
  const key = iconOnly ? (
    <Button
      iconOnly
      aria-label={props["aria-label"] ?? ""}
      variant={variant}
      size={size}
      className={look}
    />
  ) : (
    <Button variant={variant} size={size} className={look} />
  );
  return (
    <TogglePrimitive<Value>
      data-slot="toggle"
      {...props}
      render={inToolbar ? <ToolbarPrimitive.Button render={key} /> : key}
    >
      {children}
    </TogglePrimitive>
  );
}
