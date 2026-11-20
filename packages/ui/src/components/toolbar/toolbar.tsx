"use client";

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar";
import type { ReactElement } from "react";

import { Button, type ButtonProps } from "@/components/button/button";
import { buttonVariants } from "@/components/button/button-variants";
import { Input, type InputProps } from "@/components/input/input";
import { cn, mergeClassName } from "@/lib/cn";

import { ToolbarContext } from "./toolbar-context";

export type ToolbarProps = ToolbarPrimitive.Root.Props;

/**
 * A row of controls that work on the same thing: the keys above a text, the tools of a
 * drawing, the actions of a view. It is one stop for the Tab key; the arrow keys move between
 * its controls and come round at its ends. Name it (`aria-label`) with what it works on
 * ("Text formatieren").
 *
 * The bar itself is a tray, flat on the page: the keys in it are the fittings. Put
 * `ToolbarButton`s inside, `ToggleGroup`s and `Toggle`s as they are, a `ToolbarSeparator`
 * between two kinds of control, and at most one `ToolbarInput`, last, because the arrow keys
 * also move the text cursor. It is only the bar: what the keys do is the caller's.
 */
export function Toolbar({ className, ...props }: ToolbarProps) {
  return (
    <ToolbarContext value={true}>
      <ToolbarPrimitive.Root
        data-slot="toolbar"
        className={mergeClassName(
          // Too narrow for all of its keys, a row breaks onto a second line instead of running
          // out of its place.
          "flex flex-wrap items-center gap-1 data-[orientation=vertical]:flex-col data-[orientation=vertical]:flex-nowrap",
          className,
        )}
        {...props}
      />
    </ToolbarContext>
  );
}

/** `Omit` that keeps a union a union: a key is named either by its words or by `aria-label`. */
type Without<Props, Key extends PropertyKey> = Props extends unknown ? Omit<Props, Key> : never;

export type ToolbarButtonProps = Without<ButtonProps, "render"> & {
  /**
   * Another control to be the key: the trigger of a `Select` (`render={<SelectTrigger />}`).
   * The trigger of a menu, a popover or a dialog goes the other way round:
   * `<MenuTrigger render={<ToolbarButton />}>`.
   */
  render?: ReactElement;
};

/**
 * One key of a toolbar: a quiet, small `Button` unless told otherwise. A key that cannot be
 * used right now stays in reach of the arrow keys and says that it is disabled.
 */
export function ToolbarButton({
  render,
  size = "sm",
  variant = "quiet",
  className,
  disabled,
  focusableWhenDisabled,
  ...props
}: ToolbarButtonProps) {
  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      disabled={disabled}
      focusableWhenDisabled={focusableWhenDisabled}
      render={
        render ?? (
          <Button size={size} variant={variant} {...props} className={cn("shrink-0", className)} />
        )
      }
    />
  );
}

/** A link among the keys. It keeps link semantics and wears a quiet key. */
export function ToolbarLink({ className, ...props }: ToolbarPrimitive.Link.Props) {
  return (
    <ToolbarPrimitive.Link
      data-slot="toolbar-link"
      className={mergeClassName(
        [buttonVariants({ variant: "quiet", size: "sm" }), "shrink-0"],
        className,
      )}
      {...props}
    />
  );
}

/** Keys that belong together inside the bar, and can be disabled together. Name the group. */
export function ToolbarGroup({ className, ...props }: ToolbarPrimitive.Group.Props) {
  return (
    <ToolbarPrimitive.Group
      data-slot="toolbar-group"
      className={mergeClassName(
        "flex items-center gap-0.5 data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

/** A hairline between two kinds of control. It stands across the bar's direction. */
export function ToolbarSeparator({ className, ...props }: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      className={mergeClassName(
        [
          "shrink-0 bg-hairline forced-colors:bg-[CanvasText]",
          "data-[orientation=vertical]:mx-1 data-[orientation=vertical]:h-5 data-[orientation=vertical]:w-px",
          "data-[orientation=horizontal]:my-1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-5",
        ],
        className,
      )}
      {...props}
    />
  );
}

export type ToolbarInputProps = Omit<InputProps, "render">;

/**
 * A small field in the bar (a zoom, a page number). One per toolbar, at its end: inside it the
 * arrow keys move the text cursor, and leave the field only at the text's ends.
 */
export function ToolbarInput({ size = "sm", ...props }: ToolbarInputProps) {
  return (
    <ToolbarPrimitive.Input data-slot="toolbar-input" render={<Input size={size} {...props} />} />
  );
}
