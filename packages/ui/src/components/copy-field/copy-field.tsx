"use client";

import { type ComponentProps, useRef } from "react";

import { MiddleTruncate } from "@/components/middle-truncate/middle-truncate";
import { CopyMarks, useCopy } from "@/internal/copy";
import { useCopyKeys } from "@/internal/copy-keys";
import { fieldFace } from "@/internal/field";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

const sizes = {
  sm: { box: "h-(--control-sm) rounded-sm pr-2 pl-(--field-pad-sm)", symbol: 14 },
  md: { box: "h-(--control-md) rounded-md pr-3 pl-(--field-pad-md)", symbol: 16 },
} as const;

export type CopyFieldProps = Omit<
  ComponentProps<"button">,
  "children" | "onClick" | "type" | "value" | "aria-label"
> & {
  /** What the field shows, and what it copies unless `text` says otherwise. */
  value: string;
  /** What goes on the clipboard, if it is not what is shown. */
  text?: string;
  /** The name of the field as a key: the thing, then the action ("Adresse kopieren"). */
  label: string;
  /** Read out once the text is on the clipboard: a full sentence. */
  copiedMessage?: string;
  /** Read out when the clipboard refused: a full sentence that says what to do now. */
  failedMessage?: string;
  /** How many letters before the end stay after the cut, where the value is too long. */
  keep?: number;
  size?: "sm" | "md";
  /** Called once the text has reached the clipboard. */
  onCopied?: () => void;
};

/**
 * A value to hand on as it stands (an address, a line of Markdown, a command), shown in a
 * socket in mono on one line, cut in its middle where it is too long, so its end (the file's
 * name) stays. The whole field is the key: a press anywhere on it copies, and the copy symbol
 * at its end gives way to the drawn tick, as in a `CopyButton`; there is no toast. When the
 * browser refuses the clipboard, the value is selected instead.
 *
 * For a value that is read more than copied, set it as text with a `CopyButton` beside it.
 */
export function CopyField({
  value,
  text = value,
  label,
  copiedMessage,
  failedMessage: failedMessageProp,
  keep = 16,
  size = "md",
  onCopied,
  className,
  ...props
}: CopyFieldProps) {
  const { messages } = useLocale();
  const copyKeys = useCopyKeys();
  const failedMessage = failedMessageProp ?? messages.copy.selectedMessage(copyKeys);
  const shown = useRef<HTMLSpanElement>(null);
  const { state, copy } = useCopy({ text, selectTarget: shown, onCopied });
  return (
    <span data-slot="copy-field-frame" className="relative flex min-w-0">
      <button
        type="button"
        data-slot="copy-field"
        data-state={state}
        onClick={() => void copy()}
        className={cn(
          fieldFace,
          // A key, as a `CopyPill` is: the pointing hand, not the copy cursor's plus.
          "group/copy flex w-full min-w-0 cursor-pointer items-center gap-2 text-left",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          sizes[size].box,
          className,
        )}
        {...props}
      >
        {/* The key's name is the action, then the value it copies, as it is shown. */}
        <span className="sr-only">{label}: </span>
        <span
          ref={shown}
          data-slot="copy-field-value"
          // Selected after a refusal, ⌘C must take the text itself: the selection also holds
          // the cut the field shows and the copies `MiddleTruncate` keeps out of sight.
          onCopy={(event) => {
            event.clipboardData.setData("text/plain", text);
            event.preventDefault();
          }}
          className="min-w-0 flex-1 font-mono text-sm text-fg-body"
        >
          <MiddleTruncate text={value} keep={keep} />
        </span>
        {/* The symbol darkens with the field under the pointer, as a quiet key's does. */}
        <span className="shrink-0 text-fg-muted transition-colors spring-snap group-hover/copy:text-fg">
          <CopyMarks copied={state === "copied"} size={sizes[size].symbol} />
        </span>
      </button>
      <span role="status" className="sr-only">
        {state === "copied"
          ? (copiedMessage ?? messages.copy.copiedMessage)
          : state === "failed"
            ? failedMessage
            : ""}
      </span>
    </span>
  );
}
