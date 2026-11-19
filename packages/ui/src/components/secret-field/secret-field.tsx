"use client";

import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Icon } from "@/components/icon/icon";
import { Input, type InputProps } from "@/components/input/input";
import { InputGroup, InputGroupButton } from "@/components/input-group/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip/tooltip";
import { CopyMarks, useCopy } from "@/internal/copy";
import type { FieldSize } from "@/internal/field";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";

/** How many discs stand for a hidden value at most: its length is nobody's business. */
const MASK_LENGTH = 24;

const symbolSize = { sm: 14, md: 16, lg: 16 } as const;

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
  ...props
}: SecretFieldProps) {
  const [own, setOwn] = useState(defaultRevealed);
  const revealed = !hideable || (revealedProp ?? own);
  const field = useRef<HTMLInputElement>(null);

  // The value changes in one frame and settles in the next: a short fade out of a little blur,
  // so the swap between discs and characters does not read as a flicker.
  const [swapping, setSwapping] = useState(false);
  const settle = useRef(0);
  useEffect(() => () => cancelAnimationFrame(settle.current), []);

  const show = (next: boolean) => {
    cancelAnimationFrame(settle.current);
    setSwapping(true);
    setOwn(next);
    onRevealedChange?.(next);
    settle.current = requestAnimationFrame(() => {
      settle.current = requestAnimationFrame(() => setSwapping(false));
    });
  };

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
          onFocus={(event) => event.currentTarget.select()}
          className={cn(
            "font-mono text-ellipsis",
            "transition-[opacity,filter] spring-snap data-swapping:opacity-0 data-swapping:blur-[2px] data-swapping:transition-none motion-reduce:data-swapping:blur-none",
          )}
          {...props}
        />
        {hideable && (
          <Tooltip>
            <TooltipTrigger
              closeOnClick={false}
              render={
                <InputGroupButton
                  aria-label={revealLabel}
                  aria-pressed={revealed}
                  data-secret-key="reveal"
                  onClick={() => show(!revealed)}
                >
                  {/* The eye gives way to the struck eye, as the copy symbol does to the tick. */}
                  <span
                    data-revealed={revealed ? "" : undefined}
                    className="group/eye grid place-items-center *:col-start-1 *:row-start-1 *:transition-[scale,opacity] *:spring-seat motion-reduce:*:scale-100"
                  >
                    <Icon
                      icon={ViewIcon}
                      size={symbolSize[size]}
                      className="group-data-revealed/eye:scale-50 group-data-revealed/eye:opacity-0 group-data-revealed/eye:spring-leave"
                    />
                    <Icon
                      icon={ViewOffSlashIcon}
                      size={symbolSize[size]}
                      className="scale-50 opacity-0 spring-leave group-data-revealed/eye:scale-100 group-data-revealed/eye:opacity-100 group-data-revealed/eye:spring-seat"
                    />
                  </span>
                </InputGroupButton>
              }
            />
            <TooltipContent>{revealed ? hideLabel : revealLabel}</TooltipContent>
          </Tooltip>
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
                <CopyMarks copied={state === "copied"} size={symbolSize[size]} />
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
