"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";

import { Button } from "@/components/button/button";
import { useGround, useGroundMode } from "@/components/ground/ground";
import { CloseGlyph } from "@/internal/glyphs";
import {
  overlayBackdrop,
  overlayDescription,
  overlayFooter,
  overlayHeader,
  overlayPopup,
  overlayTitle,
  overlayViewport,
} from "@/internal/overlay";
import { OverlayBody, type OverlayBodyProps } from "@/internal/overlay-body";
import { cn, mergeClassName } from "@/lib/cn";

/**
 * A task that needs the whole attention for a moment: a short form, a detail, a choice. The page
 * behind it is dimmed and inert. Escape, a click outside or the close button leave it; if leaving
 * must not happen by accident, use an `AlertDialog`.
 */
export const Dialog = DialogPrimitive.Root;

export function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/** Closes the dialog. Render a `Button` through it: `<DialogClose render={<Button />}>`. */
export function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export type DialogContentProps = DialogPrimitive.Popup.Props & {
  /** Leaves out the close button in the corner. The footer must then offer the way out. */
  hideClose?: boolean;
  /** The accessible name of the close button. */
  closeLabel?: string;
};

/**
 * The sheet, with its scrim. Put a `DialogHeader` with a `DialogTitle` inside (the title names
 * the dialog for assistive tech), then a `DialogBody` and a `DialogFooter` as needed.
 */
export function DialogContent({
  className,
  children,
  hideClose = false,
  closeLabel = "Schließen",
  ...props
}: DialogContentProps) {
  const ground = useGround();
  const groundMode = useGroundMode();
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop data-slot="dialog-backdrop" className={overlayBackdrop} />
      <DialogPrimitive.Viewport data-slot="dialog-viewport" className={overlayViewport}>
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          data-theme={ground}
          data-mode={groundMode}
          className={mergeClassName(overlayPopup, className)}
          {...props}
        >
          {children}
          {/* Last in the DOM, so focus lands on the content first, not on the way out. */}
          {!hideClose && (
            <DialogPrimitive.Close
              render={
                <Button
                  iconOnly
                  size="sm"
                  variant="quiet"
                  aria-label={closeLabel}
                  className="absolute top-3 right-3 text-fg-muted"
                />
              }
            >
              <CloseGlyph />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn(overlayHeader, className)} {...props} />;
}

/** A sentence that says what this is about ("Angebot senden."). */
export function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={mergeClassName(overlayTitle, className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={mergeClassName(overlayDescription, className)}
      {...props}
    />
  );
}

/** The content. It scrolls when it is taller than the window allows. */
export function DialogBody(props: OverlayBodyProps) {
  return <OverlayBody data-slot="dialog-body" {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn(overlayFooter, className)} {...props} />;
}
