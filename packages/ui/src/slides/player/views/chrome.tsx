import type { ReactNode } from "react";

import type { SlideEntry } from "@/slides/deck/flatten-slides";
import type { PlayerLabels } from "@/slides/player/labels";

/** What every view of the player is handed. */
export type ViewProps = {
  /** The deck's slides, in order. */
  entries: readonly SlideEntry[];
  labels: PlayerLabels;
  /** The deck's language, as a BCP 47 tag. */
  lang: string;
};

/*
 * The player's own controls. They are interface, not slide: the library's tokens and its UI type
 * scale, flat on Ink. Plain elements, so the player brings no Base UI with it.
 */

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** A button of the console with its word on it. Pressed (`aria-pressed`), it takes the accent. */
export const controlButton = `touch-target relative inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium whitespace-nowrap text-fg hover:bg-hover aria-disabled:border-hairline aria-disabled:text-on-disabled aria-disabled:hover:bg-transparent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent aria-pressed:hover:border-accent-hover aria-pressed:hover:bg-accent-hover ${focus}`;

/** A button that is one icon. It needs an `aria-label`. */
export const iconButton = `touch-target relative inline-flex size-9 shrink-0 items-center justify-center rounded-md text-fg hover:bg-hover aria-disabled:text-on-disabled aria-disabled:hover:bg-transparent ${focus}`;

/** A link in the audience's bar: its word, without an edge of its own inside the bar's. */
export const barLink = `touch-target relative inline-flex h-9 shrink-0 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-fg hover:bg-hover ${focus}`;

/** A quiet button inside a block's head: its word only. */
export const textButton = `touch-target relative inline-flex h-7 shrink-0 items-center rounded-sm px-2 text-sm font-medium whitespace-nowrap text-fg-muted hover:bg-hover hover:text-fg ${focus}`;

/** The key that does the same as the button it stands in. */
export function KeyHint({ children }: { children: ReactNode }) {
  return (
    <kbd
      aria-hidden="true"
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-current/30 px-1 font-sans text-sm leading-none font-medium"
    >
      {children}
    </kbd>
  );
}

type BlockHeadProps = {
  /** The block's name, in sentence case. */
  children: ReactNode;
  /** What stands at the head's right end: a button, a status. */
  aside?: ReactNode;
};

/** The head of a block of the console: a 2px rule opens it, as on a slide. */
export function BlockHead({ children, aside }: BlockHeadProps) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-4 border-t-2 border-rule">
      <h2 className="truncate text-sm font-medium text-fg">{children}</h2>
      {aside}
    </div>
  );
}
