"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { type ComponentProps, createContext, useContext } from "react";

import { Button } from "@/components/button/button";
import { useGround, useGroundMode } from "@/components/ground/ground";
import { CloseGlyph } from "@/internal/glyphs";
import { overlayDescription, overlayFooter, overlayHeader, overlayTitle } from "@/internal/overlay";
import { OverlayBody, type OverlayBodyProps } from "@/internal/overlay-body";
import { cn, mergeClassName } from "@/lib/cn";

/** The edge a drawer comes from. It is swiped back towards that edge to close it. */
export type DrawerSide = "bottom" | "right" | "left";

const swipeDirections = { bottom: "down", right: "right", left: "left" } as const;

// The root renders no element, so the side reaches the sheet through context.
const DrawerSideContext = createContext<DrawerSide>("bottom");

export type DrawerProps = Omit<DrawerPrimitive.Root.Props, "swipeDirection"> & {
  /** The edge the sheet comes from: `bottom` on a phone, a side for detail next to a list. */
  side?: DrawerSide;
};

/**
 * A sheet from the edge of the window that can be pushed back with a finger: filters and actions
 * on a phone (from the bottom), the detail of a row next to its list (from the side). The page
 * behind it is dimmed and inert, as with a `Dialog`.
 *
 * Use it where the gesture matters. A task that needs the middle of the screen and a decision
 * is a `Dialog`; a few choices next to a button are a `Menu` or a `Popover`.
 */
export function Drawer({ side = "bottom", ...props }: DrawerProps) {
  return (
    <DrawerSideContext value={side}>
      <DrawerPrimitive.Root swipeDirection={swipeDirections[side]} {...props} />
    </DrawerSideContext>
  );
}

export function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

/** Closes the drawer. Render a `Button` through it: `<DrawerClose render={<Button />}>`. */
export function DrawerClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

/**
 * Where the sheet stands and how it moves, per side.
 *
 * It follows the finger and springs back on `sheet` when let go. It arrives from its edge on
 * `sheet`. Closed by a button, Escape or a press outside it leaves like every sheet, by fading;
 * swiped away, it keeps going the way it was thrown, as fast as it was thrown.
 *
 * The offset is `transform`, not `translate` as elsewhere: under the finger Base UI sets
 * `transform` (and `transition: none`) on the sheet itself, and that has to replace our offset.
 * On another property the two would add up and the sheet would run twice as far as the finger.
 *
 * `--bleed` is sheet beyond the window's edge: pulled the other way, the sheet stretches a
 * little, and no gap opens behind it.
 */
const sides = {
  bottom: {
    viewport: "items-end justify-center",
    popup: [
      "-mb-(--bleed) max-h-[calc(85dvh+var(--bleed))] w-full max-w-xl rounded-t-2xl px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+var(--bleed))]",
      "[transform:translateY(calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y,0px)))]",
      "motion-safe:data-starting-style:[transform:translateY(calc(100%-var(--bleed)))]",
      "motion-safe:data-swipe-dismiss:data-ending-style:[transform:translateY(calc(100%-var(--bleed)))]",
    ],
    close: "top-3 right-3",
  },
  right: {
    viewport: "items-stretch justify-end",
    popup: [
      "-mr-(--bleed) h-full w-[calc(24rem+var(--bleed))] max-w-[calc(100vw-3rem+var(--bleed))] rounded-l-2xl py-6 pr-[calc(1.5rem+var(--bleed))] pl-6",
      "[transform:translateX(var(--drawer-swipe-movement-x,0px))]",
      "motion-safe:data-starting-style:[transform:translateX(calc(100%-var(--bleed)))]",
      "motion-safe:data-swipe-dismiss:data-ending-style:[transform:translateX(calc(100%-var(--bleed)))]",
    ],
    close: "top-3 right-[calc(0.75rem+var(--bleed))]",
  },
  left: {
    viewport: "items-stretch justify-start",
    popup: [
      "-ml-(--bleed) h-full w-[calc(24rem+var(--bleed))] max-w-[calc(100vw-3rem+var(--bleed))] rounded-r-2xl py-6 pr-6 pl-[calc(1.5rem+var(--bleed))]",
      "[transform:translateX(var(--drawer-swipe-movement-x,0px))]",
      "motion-safe:data-starting-style:[transform:translateX(calc(var(--bleed)-100%))]",
      "motion-safe:data-swipe-dismiss:data-ending-style:[transform:translateX(calc(var(--bleed)-100%))]",
    ],
    close: "top-3 right-3",
  },
} as const;

export type DrawerContentProps = DrawerPrimitive.Popup.Props & {
  /** Leaves out the close button in the corner. The footer must then offer the way out. */
  hideClose?: boolean;
  /** The accessible name of the close button. */
  closeLabel?: string;
};

/**
 * The sheet, with its scrim. Put a `DrawerHeader` with a `DrawerTitle` inside (the title names
 * the drawer for assistive tech), then a `DrawerBody` and a `DrawerFooter` as needed. A sheet
 * from the bottom carries a grabber: it says that it can be pulled.
 */
export function DrawerContent({
  className,
  children,
  hideClose = false,
  closeLabel = "Schließen",
  ...props
}: DrawerContentProps) {
  const ground = useGround();
  const groundMode = useGroundMode();
  const side = useContext(DrawerSideContext);
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        data-slot="drawer-backdrop"
        // The scrim clears as the sheet is pulled away, in step with the finger. It is as tall as
        // the window with the browser's bars collapsed (`lvh`), so Safari's bars are dimmed too.
        className="fixed inset-x-0 top-0 z-50 h-lvh bg-scrim opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0"
      />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className={cn("fixed inset-0 z-50 flex overflow-hidden", sides[side].viewport)}
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          data-theme={ground}
          data-mode={groundMode}
          className={mergeClassName(
            [
              "relative flex flex-col bg-sheet text-base text-fg-body depth-overlay outline-hidden [--bleed:3rem]",
              sides[side].popup,
              "transition-[transform,opacity] spring-sheet data-swiping:select-none",
              "motion-reduce:data-starting-style:opacity-0",
              "data-ending-style:opacity-0 data-ending-style:spring-leave",
              // Thrown away: no spring, it simply continues, for as long as the throw says.
              "data-swipe-dismiss:data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*400ms)] data-swipe-dismiss:data-ending-style:ease-out",
            ],
            className,
          )}
          {...props}
        >
          {side === "bottom" && (
            <div
              data-slot="drawer-grabber"
              aria-hidden
              className="mx-auto mb-4 h-1 w-9 shrink-0 rounded-full bg-line"
            />
          )}
          {/* Text inside can be selected with a mouse without that counting as a swipe. */}
          <DrawerPrimitive.Content
            data-slot="drawer-inner"
            className="flex min-h-0 flex-1 flex-col gap-5"
          >
            {children}
          </DrawerPrimitive.Content>
          {/* Last in the DOM, so focus lands on the content first, not on the way out. */}
          {!hideClose && (
            <DrawerPrimitive.Close
              render={
                <Button
                  iconOnly
                  size="sm"
                  variant="quiet"
                  aria-label={closeLabel}
                  className={cn("absolute text-fg-muted", sides[side].close)}
                />
              }
            >
              <CloseGlyph />
            </DrawerPrimitive.Close>
          )}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

export function DrawerHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="drawer-header" className={cn(overlayHeader, className)} {...props} />;
}

/** A sentence that says what this is about ("Angebote filtern."). */
export function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={mergeClassName(overlayTitle, className)}
      {...props}
    />
  );
}

export function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={mergeClassName(overlayDescription, className)}
      {...props}
    />
  );
}

/** The content. It scrolls when it is taller than the sheet allows. */
export function DrawerBody(props: OverlayBodyProps) {
  return <OverlayBody data-slot="drawer-body" {...props} />;
}

export function DrawerFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="drawer-footer" className={cn(overlayFooter, className)} {...props} />;
}
