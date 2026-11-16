"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import type { ComponentProps } from "react";

import { useGround } from "@/components/ground/ground";
import {
  overlayBackdrop,
  overlayDescription,
  overlayFooter,
  overlayHeader,
  overlayPopup,
  overlayTitle,
  overlayViewport,
} from "@/internal/overlay";
import { cn, mergeClassName } from "@/lib/cn";

/**
 * A question that must be answered before anything else: confirming something that cannot be
 * undone. It has no close button and a click outside does not dismiss it. Name the consequence in
 * the title, and label the buttons with what they do ("Angebot löschen", "Behalten"), never "OK".
 */
export const AlertDialog = AlertDialogPrimitive.Root;

export function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

/**
 * Closes the dialog. Both answers are rendered through it:
 * `<AlertDialogClose render={<Button variant="danger" onClick={remove} />}>`.
 */
export function AlertDialogClose(props: AlertDialogPrimitive.Close.Props) {
  return <AlertDialogPrimitive.Close data-slot="alert-dialog-close" {...props} />;
}

export function AlertDialogContent({ className, ...props }: AlertDialogPrimitive.Popup.Props) {
  const ground = useGround();
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        data-slot="alert-dialog-backdrop"
        className={overlayBackdrop}
      />
      <AlertDialogPrimitive.Viewport data-slot="alert-dialog-viewport" className={overlayViewport}>
        <AlertDialogPrimitive.Popup
          data-slot="alert-dialog-content"
          data-theme={ground}
          className={mergeClassName([overlayPopup, "max-w-sm"], className)}
          {...props}
        />
      </AlertDialogPrimitive.Viewport>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(overlayHeader, "pr-0", className)}
      {...props}
    />
  );
}

/** The consequence, as a question or a sentence ("Angebot wirklich löschen?"). */
export function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={mergeClassName(overlayTitle, className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={mergeClassName(overlayDescription, className)}
      {...props}
    />
  );
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="alert-dialog-footer" className={cn(overlayFooter, className)} {...props} />
  );
}
