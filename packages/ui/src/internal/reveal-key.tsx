"use client";

import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/icon/icon";
import { InputGroupButton } from "@/components/input-group/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip/tooltip";
import type { FieldSize } from "@/internal/field";
import { cn } from "@/lib/cn";

/** The symbols of the keys inside a secret's field, by the field's size. */
export const secretSymbolSize = { sm: 14, md: 16, lg: 16 } as const;

/**
 * The key with the eye of a secret's field (`SecretField`, `StoredSecretField`): a toggle that
 * shows the value and hides it again. The eye gives way to the struck eye, as the copy symbol
 * does to the tick, and the tooltip says what a press will do.
 */
export function RevealKey({
  revealed,
  onRevealedChange,
  size = "md",
  revealLabel,
  hideLabel,
  swapping = false,
}: {
  revealed: boolean;
  onRevealedChange: (revealed: boolean) => void;
  size?: FieldSize;
  /** The key's name, and its tooltip while hidden. */
  revealLabel: string;
  /** Its tooltip while shown. */
  hideLabel: string;
  /** The field's text is being swapped (`useSwap`): the eye arrives with it. */
  swapping?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        closeOnClick={false}
        render={
          <InputGroupButton
            aria-label={revealLabel}
            aria-pressed={revealed}
            data-secret-key="reveal"
            onClick={() => onRevealedChange(!revealed)}
          >
            <span
              data-revealed={revealed ? "" : undefined}
              data-swapping={swapping ? "" : undefined}
              className={cn(
                "group/eye grid place-items-center *:col-start-1 *:row-start-1 *:transition-[scale,opacity] *:spring-seat motion-reduce:*:scale-100",
                swapSettle,
              )}
            >
              <Icon
                icon={ViewIcon}
                size={secretSymbolSize[size]}
                className="group-data-revealed/eye:scale-50 group-data-revealed/eye:opacity-0 group-data-revealed/eye:spring-leave"
              />
              <Icon
                icon={ViewOffSlashIcon}
                size={secretSymbolSize[size]}
                className="scale-50 opacity-0 spring-leave group-data-revealed/eye:scale-100 group-data-revealed/eye:opacity-100 group-data-revealed/eye:spring-seat"
              />
            </span>
          </InputGroupButton>
        }
      />
      <TooltipContent>{revealed ? hideLabel : revealLabel}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The text of a secret's field changes in one frame and settles in the next: a short fade out of
 * a little blur, so a swap between discs and characters does not read as a flicker. The one
 * place a blur is used. Put `data-swapping` on the text while `swapping`, with `swapSettle`.
 */
export function useSwap() {
  const [swapping, setSwapping] = useState(false);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const swap = (change: () => void) => {
    cancelAnimationFrame(frame.current);
    setSwapping(true);
    change();
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => setSwapping(false));
    });
  };
  return { swapping, swap };
}

export const swapSettle =
  "transition-[opacity,filter] spring-snap data-swapping:opacity-0 data-swapping:blur-[2px] data-swapping:transition-none motion-reduce:data-swapping:blur-none";
