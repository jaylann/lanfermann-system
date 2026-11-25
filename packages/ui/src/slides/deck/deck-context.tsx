"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

type DeckInfo = {
  /** The deck's title, for the footer row. */
  title?: ReactNode;
  /** How many slides the deck has. */
  count: number;
};

type SlidePosition = {
  /** Counted from 0. The page number is one more. */
  index: number;
};

const DeckContext = createContext<DeckInfo | undefined>(undefined);
const SlidePositionContext = createContext<SlidePosition | undefined>(undefined);

/** What a slide knows about its deck. `Deck` provides it, and so does a player that lays the
 * slides out itself. */
export function DeckProvider({
  title,
  count,
  children,
}: DeckInfo & {
  children: ReactNode;
}) {
  const value = useMemo(() => ({ title, count }), [title, count]);
  return <DeckContext value={value}>{children}</DeckContext>;
}

/** Tells the slide inside where it stands in its deck. */
export function SlidePositionProvider({
  index,
  children,
}: SlidePosition & { children: ReactNode }) {
  const value = useMemo(() => ({ index }), [index]);
  return <SlidePositionContext value={value}>{children}</SlidePositionContext>;
}

/** The deck around a slide, or `undefined` for a slide that stands alone. */
export function useDeck(): DeckInfo | undefined {
  return useContext(DeckContext);
}

/** Where a slide stands in its deck, or `undefined` for a slide that stands alone. */
export function useSlidePosition(): SlidePosition | undefined {
  return useContext(SlidePositionContext);
}
