"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { popupMotion } from "@/internal/popup";
import { mergeClassName } from "@/lib/cn";

/**
 * Put one around a toolbar or the app: once a tooltip has shown, its neighbours open at once
 * instead of each waiting out the delay again.
 */
export const TooltipProvider = TooltipPrimitive.Provider;

/**
 * A label for a control that has none on screen, such as an icon button. Nobody must miss
 * anything by never seeing it: it does not appear on touch devices, and the trigger still needs
 * its own `aria-label`. For an explanation, use a `Popover` or write it on the page.
 */
export const Tooltip = TooltipPrimitive.Root;

export function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

export type TooltipContentProps = TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset">;

/** The system's own voice: it speaks on Ink, on every ground. A few words, no full stop. */
export function TooltipContent({
  className,
  side = "top",
  align = "center",
  sideOffset = 6,
  alignOffset,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        data-slot="tooltip-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          data-theme="ink"
          className={mergeClassName(
            [
              "max-w-64 rounded-sm bg-sheet px-2 py-1 text-sm font-medium text-fg depth-floating",
              popupMotion,
            ],
            className,
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}
