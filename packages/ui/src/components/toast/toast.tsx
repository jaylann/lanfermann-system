"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import type { ReactNode } from "react";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { Spinner } from "@/components/spinner/spinner";
import { CloseGlyph } from "@/internal/glyphs";
import { statusIcons, statusIconTone, type StatusTone } from "@/internal/status-icon";
import { cn } from "@/lib/cn";

/** The one stack of the app. `toast()` adds to it from anywhere, also from outside React. */
export const toastManager = ToastPrimitive.createToastManager();

export type ToastTone = "neutral" | "info" | "success" | "warning" | "danger";

export type ToastOptions = {
  /** What happened, as a short sentence ("Angebot gesendet."). */
  title: ReactNode;
  /** One more line, if the title does not say enough. */
  description?: ReactNode;
  /** Adds the status icon. The words still carry the message. */
  tone?: ToastTone;
  /** One action, usually the way back ("Rückgängig"). */
  action?: { label: ReactNode; onClick: () => void };
  /** Milliseconds until it leaves by itself; 0 keeps it until dismissed. */
  timeout?: number;
  /** Reuse an id to update a toast in place instead of adding one. */
  id?: string;
};

function show(options: ToastOptions | string): string {
  const { title, description, tone, action, timeout, id } =
    typeof options === "string" ? ({ title: options } satisfies ToastOptions) : options;
  return toastManager.add({
    id,
    title,
    description,
    type: tone,
    timeout,
    // A failure interrupts the screen reader; everything else waits its turn.
    priority: tone === "danger" ? "high" : "low",
    actionProps: action ? { children: action.label, onClick: action.onClick } : undefined,
  });
}

/**
 * Confirms what just happened, in the system's own voice: `toast("Entwurf gespeichert.")` or
 * `toast({ title, description, tone, action })`. It returns the toast's id.
 *
 * A toast leaves by itself, so it never carries anything a person must read or act on: that
 * belongs on the page (an `Alert`) or in a dialog. Render one `<Toaster />` near the app root.
 */
export const toast = Object.assign(show, {
  /** Closes one toast, or all of them without an id. */
  dismiss: (id?: string) => toastManager.close(id),
  /**
   * Follows a promise through loading, success and error in one toast:
   * `toast.promise(send(), { loading: "Wird gesendet …", success: "Gesendet.", error: "…" })`.
   */
  promise: toastManager.promise,
});

// Base UI's `promise` reports "loading", "success" and "error"; "error" is our "danger".
function ToneIcon({ type }: { type: string | undefined }) {
  if (type === "loading") return <Spinner className="mt-[3px] text-fg-muted" />;
  const tone: StatusTone | undefined =
    type === "error" ? "danger" : type === "neutral" ? undefined : (type as StatusTone);
  if (!tone || !(tone in statusIcons)) return null;
  return <Icon icon={statusIcons[tone]} size={18} className={cn("mt-0.5", statusIconTone[tone])} />;
}

function ToastList({ closeLabel }: { closeLabel: string }) {
  const { toasts } = ToastPrimitive.useToastManager();
  return toasts.map((item) => (
    <ToastPrimitive.Root
      key={item.id}
      toast={item}
      data-slot="toast"
      // The system's own voice: a toast speaks on Ink, on every ground.
      data-theme="ink"
      className="toast-stack rounded-xl bg-sheet text-fg depth-floating focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <ToastPrimitive.Content
        data-slot="toast-content"
        className="flex items-start gap-3 overflow-hidden py-3 pr-2.5 pl-3.5 transition-opacity duration-200 ease-out data-behind:opacity-0 data-expanded:opacity-100"
      >
        <ToneIcon type={item.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-px">
          {item.title && (
            <ToastPrimitive.Title
              data-slot="toast-title"
              className="text-control font-semibold text-fg"
            />
          )}
          {item.description && (
            <ToastPrimitive.Description
              data-slot="toast-description"
              className="text-sm text-fg-body"
            />
          )}
        </div>
        {item.actionProps && (
          // The keys stand in the middle of the toast's height, whether it has one line or two;
          // the tone's icon stays with the title.
          <ToastPrimitive.Action
            data-slot="toast-action"
            className="self-center"
            render={<Button size="sm" />}
          />
        )}
        <ToastPrimitive.Close
          data-slot="toast-close"
          render={
            <Button
              iconOnly
              size="sm"
              variant="quiet"
              aria-label={closeLabel}
              className="self-center text-fg-muted"
            />
          }
        >
          <CloseGlyph />
        </ToastPrimitive.Close>
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  ));
}

export type ToasterProps = {
  /** How many toasts show at once; older ones wait behind. */
  limit?: number;
  /** Milliseconds a toast stays unless it sets its own `timeout`. */
  timeout?: number;
  /** The accessible name of each toast's close button. */
  closeLabel?: string;
  /** The accessible name of the stack, the landmark F6 jumps to. */
  label?: string;
};

/**
 * Where toasts appear: bottom right, newest in front, older ones peeking out behind it. Hovering
 * or focusing the stack (F6 jumps to it) spreads it into a list and holds the timers. A toast can
 * be swiped away to the right or downwards.
 */
export function Toaster({
  limit = 3,
  timeout = 5000,
  closeLabel = "Schließen",
  label = "Benachrichtigungen",
}: ToasterProps) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} limit={limit} timeout={timeout}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport
          data-slot="toast-viewport"
          aria-label={label}
          // On a phone the stack keeps clear of the home indicator and the rounded corners.
          className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 w-[calc(100vw-2rem)] sm:right-[max(1.5rem,env(safe-area-inset-right))] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:w-90"
        >
          <ToastList closeLabel={closeLabel} />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}
