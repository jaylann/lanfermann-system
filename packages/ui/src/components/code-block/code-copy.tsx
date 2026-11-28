"use client";

import type { RefObject } from "react";

import { CopyButton, type CopyButtonLabels } from "@/components/copy-button/copy-button";
import { useCopyKeys } from "@/internal/copy-keys";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

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
  copyLabel,
  copiedLabel,
  copiedMessage,
  failedLabel,
  failedMessage: failedMessageProp,
  className,
}: CodeCopyProps) {
  const { messages } = useLocale();
  const copyKeys = useCopyKeys();
  const failedMessage = failedMessageProp ?? messages.codeBlock.failedMessage(copyKeys);
  return (
    <CopyButton
      data-slot="code-copy"
      size="sm"
      text={text}
      selectTarget={codeRef}
      copyLabel={copyLabel ?? messages.codeBlock.copy}
      copiedLabel={copiedLabel}
      copiedMessage={copiedMessage ?? messages.codeBlock.copiedMessage}
      failedLabel={failedLabel}
      failedMessage={failedMessage}
      className={cn("flex", className)}
    />
  );
}
