"use client";

import type { ReactNode } from "react";

import { useDeck, useSlidePosition } from "@/slides/deck/deck-context";

export type FooterProps = {
  /** The deck's title, in sentence case. Inside a `Deck` it is the deck's own. */
  deck?: ReactNode;
  /** The page number. Inside a `Deck` it is the slide's place, counted from 1. */
  page?: ReactNode;
};

/**
 * The single footer row of a content slide: the wordmark as live text on the left, the deck's
 * title and the page number on the right, all on one line 64px above the foot. `Slide` draws it;
 * the cover and the closing slide have none.
 */
export function Footer({ deck, page }: FooterProps) {
  const info = useDeck();
  const position = useSlidePosition();
  const title = deck ?? info?.title;
  const number = page ?? (position ? position.index + 1 : undefined);
  return (
    <footer data-slot="slide-footer" className="contents text-slide-meta leading-none">
      <p className="absolute bottom-16 left-32 slide-span-4 font-bold tracking-[-0.1px] text-fg">
        Lanfermann<span className="text-accent">.</span>dev
      </p>
      {title != null && (
        <p className="absolute right-52 bottom-16 slide-span-6 text-right text-fg-muted">{title}</p>
      )}
      {number != null && (
        <p className="absolute right-32 bottom-16 w-14 text-right text-fg tabular-nums">{number}</p>
      )}
    </footer>
  );
}
