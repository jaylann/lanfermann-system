"use client";

import type { ReactElement } from "react";

import { Shortcut } from "@/components/shortcut/shortcut";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip/tooltip";

export type KeyTipProps = {
  /** The key's name: the same words as its `aria-label`. */
  label: string;
  /** Its keyboard shortcut, written as for a `Shortcut` (`mod+b`), shown after the name. */
  shortcut?: string;
  /** The key itself, which becomes the tooltip's trigger. */
  trigger: ReactElement;
};

/**
 * The name of a key that shows only a symbol, said above it under the pointer, with its shortcut
 * when it has one. A toolbar gives one to each of its symbol keys: in a row of symbols the name
 * is what the reader is missing. It shows nothing on a touch screen; the key's `aria-label`
 * still names it there.
 */
export function KeyTip({ label, shortcut, trigger }: KeyTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={trigger} />
      <TooltipContent className="flex items-center gap-2">
        {label}
        {shortcut !== undefined && <Shortcut keys={shortcut} />}
      </TooltipContent>
    </Tooltip>
  );
}
