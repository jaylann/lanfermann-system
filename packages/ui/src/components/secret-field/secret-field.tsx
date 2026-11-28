"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Input, type InputProps } from "@/components/input/input";
import { InputGroup, InputGroupButton } from "@/components/input-group/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip/tooltip";
import { CopyMarks, useCopy } from "@/internal/copy";
import type { FieldSize } from "@/internal/field";
import { RevealKey, secretSymbolSize, swapSettle, useSwap } from "@/internal/reveal-key";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";

/** How many discs stand for a hidden value at most: its length is nobody's business. */
const MASK_LENGTH = 24;

export type SecretFieldProps = Omit<
  InputProps,
  "value" | "defaultValue" | "onChange" | "readOnly" | "type" | "size"
> & {
  /** The value: an API key, a webhook's secret, an invitation link. */
  value: string;
  /** The size of the field, from the density. */
  size?: FieldSize;
  /**
   * Whether the value can be hidden at all. `false` for something that is not a secret (an
   * address, a link): the field then only shows and copies it.
   */
  hideable?: boolean;
  /** Whether the value is shown (controlled). Hidden unless said otherwise. */
  revealed?: boolean;
  /** Whether the value is shown at first. */
  defaultRevealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
  /**
   * How many characters at the start stay readable while the value is hidden: the prefix that
   * says what kind of key it is (`lf_live_`).
   */
  visibleStart?: number;
  /** Called once the value has reached the clipboard. */
  onCopied?: () => void;
  /** The name of the key that shows the value; it is a toggle. Also its tooltip while hidden. */
  revealLabel?: string;
  /** The tooltip of that key while the value is shown. */
  hideLabel?: string;
  /** The name of the copy key and its tooltip. */
  copyLabel?: string;
  /** The tooltip once the value is on the clipboard. */
  copiedLabel?: string;
  /** Read out once the value is on the clipboard: a full sentence. */
  copiedMessage?: string;
  /** The tooltip when the clipboard refused; the value is then shown and selected. */
  failedLabel?: string;
  /** Read out when the clipboard refused. */
  failedMessage?: string;
  /** Classes for the field as a whole, e.g. its width. */
  className?: string;
};

/**
 * A value that is read by machines and must not be read over a shoulder: an API key, the
 * secret of a webhook. It stands in a field in mono, hidden behind discs until the key with
 * the eye is pressed, and a second key copies it. The copy always takes the real value,
 * hidden or not, and confirms with the drawn tick.
 *
 * The field cannot be typed into. Label it with a `FieldLabel` ("Geheimer Schlüssel") and say
 * in a `FieldDescription` what the reader should do with it ("Er wird nur dieses eine Mal
 * angezeigt."). While it is hidden the value is not in the page; when the browser refuses the
 * clipboard, the value is shown and selected instead, so ⌘C still works.
 */
export function SecretField({
  value,
  size = "md",
  hideable = true,
  revealed: revealedProp,
  defaultRevealed = false,
  onRevealedChange,
  visibleStart = 0,
  onCopied,
  revealLabel = "Anzeigen",
  hideLabel = "Verbergen",
  copyLabel = "Kopieren",
  copiedLabel = "Kopiert",
  copiedMessage = "In die Zwischenablage kopiert.",
  failedLabel = "Markiert",
  failedMessage = "Nicht kopiert. Der Wert ist markiert und kann mit ⌘C kopiert werden.",
  className,
  ref,
  onFocus,
  ...props
}: SecretFieldProps) {
  const [own, setOwn] = useState(defaultRevealed);
  const revealed = !hideable || (revealedProp ?? own);
  const field = useRef<HTMLInputElement>(null);

  // The value changes in one frame and settles out of a short blur in the next.
  const { swapping, swap } = useSwap();
  const show = (next: boolean) =>
    swap(() => {
      setOwn(next);
      onRevealedChange?.(next);
    });

  const { state, copy } = useCopy({
    text: value,
    selectTarget: field,
    onCopied,
    // Selecting discs would copy discs: the value is shown before it is selected.
    onRefused: () => flushSync(() => show(true)),
  });

  const shown = revealed
    ? value
    : value.slice(0, visibleStart) +
      "•".repeat(Math.min(Math.max(value.length - visibleStart, 0), MASK_LENGTH));

  return (
    <>
      <InputGroup data-slot="secret-field" size={size} className={className}>
        <Input
          ref={mergeRefs(field, ref)}
          readOnly
          value={shown}
          spellCheck={false}
          autoComplete="off"
          data-revealed={revealed ? "" : undefined}
          data-swapping={swapping ? "" : undefined}
          // Shown, a press into the field takes the whole value. Discs are not worth selecting:
          // hidden, the caret goes to the start, so the prefix that names the key stays in view
          // (a narrow field given the focus, as in a dialog on a phone, scrolled to its end).
          onFocus={(event) => {
            onFocus?.(event);
            const input = event.currentTarget;
            if (revealed) {
              input.select();
              return;
            }
            input.setSelectionRange(0, 0);
            input.scrollLeft = 0;
          }}
          className={cn("font-mono text-ellipsis", swapSettle)}
          {...props}
        />
        {hideable && (
          <RevealKey
            revealed={revealed}
            onRevealedChange={show}
            size={size}
            revealLabel={revealLabel}
            hideLabel={hideLabel}
          />
        )}
        <Tooltip>
          <TooltipTrigger
            closeOnClick={false}
            render={
              <InputGroupButton
                aria-label={copyLabel}
                data-secret-key="copy"
                onClick={() => void copy()}
              >
                <CopyMarks copied={state === "copied"} size={secretSymbolSize[size]} />
              </InputGroupButton>
            }
          />
          <TooltipContent>
            {state === "idle" ? copyLabel : state === "failed" ? failedLabel : copiedLabel}
          </TooltipContent>
        </Tooltip>
      </InputGroup>
      <span role="status" className="sr-only">
        {state === "copied" ? copiedMessage : state === "failed" ? failedMessage : ""}
      </span>
    </>
  );
}
