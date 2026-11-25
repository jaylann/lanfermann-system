"use client";

import { SlidePositionProvider } from "@/slides/deck/deck-context";
import type { SlideEntry } from "@/slides/deck/flatten-slides";

import { SlideErrorBoundary } from "./error-boundary";

type DeckSlideProps = {
  entry: SlideEntry;
  /** Counted from 0. */
  index: number;
  /** The line a slide that threw is replaced by. */
  errorLabel: string;
};

/**
 * One slide of the deck as every view of the player draws it: it knows its page, and its failure
 * stays its own. The deck's title and count come from the `DeckProvider` around the view.
 */
export function DeckSlide({ entry, index, errorLabel }: DeckSlideProps) {
  return (
    <SlidePositionProvider index={index}>
      <SlideErrorBoundary key={entry.key} label={errorLabel}>
        {entry.element}
      </SlideErrorBoundary>
    </SlidePositionProvider>
  );
}
