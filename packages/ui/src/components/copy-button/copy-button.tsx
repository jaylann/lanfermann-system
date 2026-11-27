"use client";

import type { ComponentProps, ReactNode, RefObject } from "react";

import { Button, type ButtonProps } from "@/components/button/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip/tooltip";
import { CopyMarks, useCopy } from "@/internal/copy";
import { useCopyKeys } from "@/internal/copy-keys";
import { cn } from "@/lib/cn";

/** The words of a key that copies. */
export type CopyButtonLabels = {
  /** The key's name and its tooltip: worded like a button ("Schlüssel kopieren"). */
  copyLabel?: string;
  /** The tooltip once the text is on the clipboard. */
  copiedLabel?: string;
  /** Read out once the text is on the clipboard: a full sentence. */
  copiedMessage?: string;
  /** The tooltip when the clipboard refused. */
  failedLabel?: string;
  /** Read out when the clipboard refused: a full sentence that says what to do now. */
  failedMessage?: string;
};

const symbolSize = { sm: 14, md: 16, lg: 18 } as const;

export type CopyButtonProps = Omit<ComponentProps<"span">, "children"> &
  CopyButtonLabels & {
    /**
     * What goes on the clipboard: the text, or a function that gives it. The function may
     * return a promise (a secret fetched on demand); it is called inside the press.
     */
    text: string | (() => string | Promise<string>);
    /**
     * The element that shows the text. When the browser refuses the clipboard it is selected
     * instead, so ⌘C still works: a field's text, or everything inside any other element.
     */
    selectTarget?: RefObject<HTMLElement | null>;
    /** Called once the text has reached the clipboard. */
    onCopied?: () => void;
    size?: "sm" | "md" | "lg";
    /** `quiet` (the default) beside what it copies; `secondary` where it stands on its own. */
    variant?: ButtonProps["variant"];
    disabled?: boolean;
    /**
     * Words beside the symbol ("Link kopieren"). Without them it is a square key with a
     * tooltip.
     */
    children?: ReactNode;
  };

/**
 * A key that copies: an API key, an address, an invitation link, a sentence. The copy symbol
 * shrinks away and a tick is drawn in its place, the tooltip says that it worked, and a screen
 * reader hears it once. After a moment the symbol seats back. No word appears beside the key
 * and there is no toast.
 *
 * When the browser refuses the clipboard (a page without HTTPS, a missing permission), the
 * `selectTarget` is selected instead and the key says so. Name the key after what it copies
 * (`copyLabel`), not after the mechanism. `className` goes to the box around the key, for its
 * place in a row.
 */
export function CopyButton({
  text,
  selectTarget,
  onCopied,
  size = "md",
  variant = "quiet",
  disabled,
  copyLabel = "Kopieren",
  copiedLabel = "Kopiert",
  copiedMessage = "In die Zwischenablage kopiert.",
  failedLabel = selectTarget ? "Markiert" : "Nicht kopiert",
  failedMessage: failedMessageProp,
  className,
  children,
  ...props
}: CopyButtonProps) {
  const copyKeys = useCopyKeys();
  const failedMessage =
    failedMessageProp ??
    (selectTarget
      ? `Nicht kopiert. Der Text ist markiert und kann mit ${copyKeys} kopiert werden.`
      : "Nicht kopiert. Der Browser hat den Zugriff auf die Zwischenablage abgelehnt.");
  const { state, copy } = useCopy({ text, selectTarget, onCopied });
  const marks = <CopyMarks copied={state === "copied"} size={symbolSize[size]} />;
  const word = state === "failed" ? failedLabel : copiedLabel;

  return (
    <span
      data-slot="copy-button"
      data-state={state}
      className={cn("relative inline-flex items-center", className)}
      {...props}
    >
      {children === undefined ? (
        <Tooltip>
          <TooltipTrigger
            closeOnClick={false}
            render={
              <Button
                iconOnly
                size={size}
                variant={variant}
                disabled={disabled}
                aria-label={copyLabel}
                onClick={() => void copy()}
                // A symbol only darkens under the pointer.
                className={variant === "quiet" ? "text-fg-muted hover:text-fg" : undefined}
              >
                {marks}
              </Button>
            }
          />
          <TooltipContent>{state === "idle" ? copyLabel : word}</TooltipContent>
        </Tooltip>
      ) : (
        <Button size={size} variant={variant} disabled={disabled} onClick={() => void copy()}>
          {marks}
          {children}
        </Button>
      )}
      <span role="status" className="sr-only">
        {state === "copied" ? copiedMessage : state === "failed" ? failedMessage : ""}
      </span>
    </span>
  );
}
