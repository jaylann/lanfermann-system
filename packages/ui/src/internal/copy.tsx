"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { type RefObject, useEffect, useRef, useState } from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { selectContents, writeClipboard } from "@/internal/clipboard";
import { TickGlyph } from "@/internal/glyphs";

/** How long a copy stays confirmed before the symbol comes back, in ms. */
export const COPY_SHOWN_MS = 1600;

/** Nothing happened yet, the text is on the clipboard, or the browser refused. */
export type CopyState = "idle" | "copied" | "failed";

type CopyOptions = {
  /** What goes on the clipboard: the text, or a function that gives it (or a promise of it). */
  text: string | (() => string | Promise<string>);
  /** Selected when the clipboard refuses, so ⌘C still works. */
  selectTarget?: RefObject<HTMLElement | null>;
  /** Called once the text has reached the clipboard. */
  onCopied?: () => void;
  /** Called when the clipboard refused, before the target is selected. */
  onRefused?: () => void;
};

/**
 * The copy every control performs: write the text, hold the confirmation for a moment, and when
 * the browser refuses, select what was to be copied instead. Draw the state with `CopyMarks`.
 */
export function useCopy({ text, selectTarget, onCopied, onRefused }: CopyOptions) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    clearTimeout(timer.current);
    try {
      await writeClipboard(typeof text === "function" ? text() : text);
      setState("copied");
      onCopied?.();
    } catch {
      onRefused?.();
      selectContents(selectTarget?.current);
      setState("failed");
    }
    // A second press may have set a timer while this one waited for the clipboard.
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), COPY_SHOWN_MS);
  }

  return { state, copy };
}

type CopyMarksProps = {
  /** The moment of confirmation: the symbol gives way to the tick. */
  copied: boolean;
  /** The symbol at rest. The copy symbol unless the key does something else (a download). */
  icon?: IconSvgElement;
  /** 14px in a small key, 16px in a default one, 18px in a large one. */
  size?: number;
};

/**
 * The two marks of a key that confirms: its symbol, and the tick that is drawn in its place
 * (copy.css). The tick keeps the weight of the symbol's stroke at every size.
 */
export function CopyMarks({ copied, icon = Copy01Icon, size = 14 }: CopyMarksProps) {
  return (
    <span
      data-slot="copy-marks"
      data-copied={copied ? "" : undefined}
      className="grid place-items-center *:col-start-1 *:row-start-1"
    >
      <Icon data-slot="copy-symbol" icon={icon} size={size} />
      <TickGlyph data-slot="copy-tick" width={size} height={size} strokeWidth={21 / size} />
    </span>
  );
}
