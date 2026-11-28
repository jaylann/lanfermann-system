"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { useGround, useGroundMode } from "@/components/ground/ground";
import { popupMotion } from "@/internal/popup";
import { mergeClassName } from "@/lib/cn";

/**
 * A small sheet anchored to what opened it: a few fields, an explanation, a filter. It may hold
 * controls, unlike a tooltip. If it needs a decision before anything else can happen, use a
 * `Dialog`.
 */
export const Popover = PopoverPrimitive.Root;

export function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

export type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >;

export function PopoverContent({
  className,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  alignOffset,
  anchor,
  ...props
}: PopoverContentProps) {
  const ground = useGround();
  const groundMode = useGroundMode();
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        data-slot="popover-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        // Where the sheet should hang from something other than its trigger: a whole field.
        anchor={anchor}
        className="z-50 max-w-(--available-width)"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          data-theme={ground}
          data-mode={groundMode}
          className={mergeClassName(
            [
              "flex w-72 flex-col gap-3 rounded-xl bg-sheet p-4 text-control text-fg-body depth-floating",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              popupMotion,
            ],
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

/** Names the popover for assistive tech. A short sentence. */
export function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={mergeClassName("text-base leading-snug font-semibold text-fg", className)}
      {...props}
    />
  );
}

export function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={mergeClassName("text-fg-body", className)}
      {...props}
    />
  );
}

/** Closes the popover. Render a `Button` through it: `<PopoverClose render={<Button />}>`. */
export function PopoverClose(props: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}
