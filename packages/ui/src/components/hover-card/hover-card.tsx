"use client";

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";

import { useGround } from "@/components/ground/ground";
import { type LinkVariants, linkVariants } from "@/components/link/link-variants";
import { popupMotion } from "@/internal/popup";
import { mergeClassName } from "@/lib/cn";

/**
 * A look at what stands behind a link, before following it: the page a term leads to, the
 * customer behind a name. It opens while the link is pointed at (after a moment, so a pointer
 * passing over does not open it) or has the keyboard, and never on a touch screen.
 *
 * It is a preview and nothing more. Everything in it must also stand where the link leads,
 * because assistive tech does not go through it: there, the link is the whole interface. For
 * something a person has to read or operate, use a `Popover`.
 */
export const HoverCard = PreviewCardPrimitive.Root;

export type HoverCardTriggerProps = PreviewCardPrimitive.Trigger.Props & LinkVariants;

/**
 * The link. It stays a link, with a link's look and its `href`; pass a router's link as `render`.
 * `delay` and `closeDelay` (ms) say how long it waits before the card opens and closes.
 */
export function HoverCardTrigger({ className, variant, ...props }: HoverCardTriggerProps) {
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      className={mergeClassName(linkVariants({ variant }), className)}
      {...props}
    />
  );
}

export type HoverCardContentProps = PreviewCardPrimitive.Popup.Props &
  Pick<PreviewCardPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset">;

/**
 * The card: a sheet that grows out of the link and hangs from the start of it, like everything
 * that is set left. A title, a line or two, perhaps a picture; nothing to press.
 */
export function HoverCardContent({
  className,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  alignOffset,
  ...props
}: HoverCardContentProps) {
  const ground = useGround();
  return (
    <PreviewCardPrimitive.Portal>
      <PreviewCardPrimitive.Positioner
        data-slot="hover-card-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50 max-w-(--available-width)"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          data-theme={ground}
          className={mergeClassName(
            [
              "flex w-72 flex-col gap-2 rounded-xl bg-sheet p-4 text-control text-fg-body depth-floating",
              popupMotion,
            ],
            className,
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}
