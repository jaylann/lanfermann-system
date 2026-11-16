"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { type RefObject, useEffect, useRef, useState } from "react";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip/tooltip";
import { TickGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

/** How long the tick stands before the copy symbol comes back. */
const SHOWN_MS = 1600;

export type CodeCopyLabels = {
  /** The button's name and its tooltip: worded like a button. */
  copyLabel?: string;
  /** The tooltip once the code is on the clipboard. */
  copiedLabel?: string;
  /** Read out once the code is on the clipboard: a full sentence. */
  copiedMessage?: string;
  /** Read out and shown when the clipboard refused; the code is then selected instead. */
  failedLabel?: string;
  failedMessage?: string;
};

type CodeCopyProps = CodeCopyLabels & {
  /** The text that goes on the clipboard. */
  text: string;
  /** The code on screen: selected when the clipboard cannot be written, so ⌘C still works. */
  codeRef: RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * The copy button of a code block: the copy symbol shrinks away and a tick is drawn in its
 * place, the tooltip says that it worked, and a screen reader hears it once. After a moment the
 * symbol seats back. If the browser refuses the clipboard, the code is selected instead.
 */
export function CodeCopy({
  text,
  codeRef,
  copyLabel = "Code kopieren",
  copiedLabel = "Kopiert",
  copiedMessage = "Der Code wurde kopiert.",
  failedLabel = "Markiert",
  failedMessage = "Der Code wurde nicht kopiert. Er ist markiert und kann mit ⌘C kopiert werden.",
  className,
}: CodeCopyProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      const code = codeRef.current;
      if (code) window.getSelection()?.selectAllChildren(code);
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), SHOWN_MS);
  }

  const copied = state === "copied";
  const word = state === "failed" ? failedLabel : copiedLabel;

  return (
    <div data-slot="code-copy" className={cn("relative flex items-center", className)}>
      <Tooltip>
        <TooltipTrigger
          closeOnClick={false}
          render={
            <Button
              iconOnly
              size="sm"
              variant="quiet"
              aria-label={copyLabel}
              onClick={() => void copy()}
              className="text-fg-muted hover:text-fg"
            >
              <span
                data-slot="code-copy-marks"
                data-copied={copied ? "" : undefined}
                className="grid place-items-center *:col-start-1 *:row-start-1"
              >
                <Icon data-slot="code-copy-symbol" icon={Copy01Icon} size={14} />
                <TickGlyph data-slot="code-copy-tick" width={14} height={14} strokeWidth={1.5} />
              </span>
            </Button>
          }
        />
        <TooltipContent>{state === "idle" ? copyLabel : word}</TooltipContent>
      </Tooltip>
      <span role="status" className="sr-only">
        {state === "copied" ? copiedMessage : state === "failed" ? failedMessage : ""}
      </span>
    </div>
  );
}
