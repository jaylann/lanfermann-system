"use client";

import type { RefObject } from "react";

import { CopyButton, type CopyButtonLabels } from "@/components/copy-button/copy-button";
import { cn } from "@/lib/cn";

/** The words of the copy key of a code block. */
export type CodeCopyLabels = CopyButtonLabels;

type CodeCopyProps = CodeCopyLabels & {
  /** The text that goes on the clipboard. */
  text: string;
  /** The code on screen: selected when the clipboard cannot be written, so ⌘C still works. */
  codeRef: RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * The copy key of a code block: a small `CopyButton` worded for code. It takes its five labels
 * by name, because a block hands it all of its key options at once.
 */
export function CodeCopy({
  text,
  codeRef,
  copyLabel = "Code kopieren",
  copiedLabel,
  copiedMessage = "Der Code wurde kopiert.",
  failedLabel,
  failedMessage = "Der Code wurde nicht kopiert. Er ist markiert und kann mit ⌘C kopiert werden.",
  className,
}: CodeCopyProps) {
  return (
    <CopyButton
      data-slot="code-copy"
      size="sm"
      text={text}
      selectTarget={codeRef}
      copyLabel={copyLabel}
      copiedLabel={copiedLabel}
      copiedMessage={copiedMessage}
      failedLabel={failedLabel}
      failedMessage={failedMessage}
      className={cn("flex", className)}
    />
  );
}
