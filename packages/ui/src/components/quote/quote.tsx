"use client";

import { type ComponentProps, type ReactNode, useRef } from "react";

import { CodeCopy, type CodeCopyLabels } from "@/components/code-block/code-copy";
import { useCopyKeys } from "@/internal/copy-keys";
import { cn } from "@/lib/cn";

export type QuoteProps = Omit<ComponentProps<"figure">, "children"> &
  CodeCopyLabels & {
    /** Who said it, or what it is ("Frage an den Assistenten"). Stands small above the words. */
    label?: ReactNode;
    /**
     * Text a reader may want to take along, such as a sentence to type to an assistant. With it,
     * a copy key stands in the bubble's corner and puts exactly this text on the clipboard.
     */
    copy?: string;
    children: ReactNode;
  };

/**
 * Someone else's words: a sentence a customer wrote, a question to type to an assistant. They
 * stand on the tint, the colour of words that are not the page's own, in a bubble as wide as the
 * text, its first corner drawn tight as a message's is.
 *
 * Give `copy` when the words are meant to be used, so a reader can take them without selecting.
 * One quote holds one message: for three example questions, set three quotes.
 */
export function Quote({
  label,
  copy,
  copyLabel = "Text kopieren",
  copiedLabel,
  copiedMessage = "Der Text wurde kopiert.",
  failedLabel,
  failedMessage: failedMessageProp,
  className,
  children,
  ...props
}: QuoteProps) {
  const copyKeys = useCopyKeys();
  const failedMessage =
    failedMessageProp ??
    `Der Text wurde nicht kopiert. Er ist markiert und kann mit ${copyKeys} kopiert werden.`;
  const words = useRef<HTMLQuoteElement>(null);
  return (
    <figure
      data-slot="quote"
      className={cn("flex min-w-0 flex-col items-start gap-1.5", className)}
      {...props}
    >
      {label ? (
        <figcaption data-slot="quote-label" className="text-sm text-fg-muted">
          {label}
        </figcaption>
      ) : null}
      {/*
        The ground's tint, not the Tint ground: on Paper the two are the same colour, and on Ink
        the tint is a deep violet where the Tint ground would be a light patch in a dark page.
      */}
      <div
        data-slot="quote-bubble"
        className={cn(
          "flex max-w-full items-start gap-1 rounded-2xl rounded-tl-sm bg-tint py-2.5 pl-4 sm:py-3 sm:pl-5",
          copy ? "pr-1.5 sm:pr-2" : "pr-4 sm:pr-5",
        )}
      >
        <blockquote
          ref={words}
          data-slot="quote-text"
          className="min-w-0 text-base text-pretty text-fg [&>*+*]:mt-2"
        >
          {children}
        </blockquote>
        {copy ? (
          <CodeCopy
            text={copy}
            codeRef={words}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            copiedMessage={copiedMessage}
            failedLabel={failedLabel}
            failedMessage={failedMessage}
            // Sits in the bubble's corner: half a line up, so its middle meets the first line's.
            className="-my-0.5 shrink-0"
          />
        ) : null}
      </div>
    </figure>
  );
}
