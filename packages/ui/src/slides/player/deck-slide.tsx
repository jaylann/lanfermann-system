"use client";

import { useLayoutEffect, useRef } from "react";

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
 *
 * The child stands in a box that takes no space (`data-slides-entry`), and the slide it draws is
 * marked with `data-slide-index` and, where it has one, `data-slide-id`: a tool that takes a
 * picture of each slide matches it to the check's report by these, not by its place in the page
 * (the hub's contract, issue #88). `Slide` is plain markup and does not know its place, so the
 * marks are written here, before the first paint.
 */
export function DeckSlide({ entry, index, errorLabel }: DeckSlideProps) {
  const box = useRef<HTMLDivElement>(null);

  // On every render: a slide that threw and was drawn again is a new element.
  useLayoutEffect(() => {
    for (const slide of box.current?.querySelectorAll('[data-slot="slide"]') ?? []) {
      slide.setAttribute("data-slide-index", String(index));
      if (entry.id === undefined) slide.removeAttribute("data-slide-id");
      else slide.setAttribute("data-slide-id", entry.id);
    }
  });

  return (
    <div ref={box} data-slides-entry={index} className="contents">
      <SlidePositionProvider index={index}>
        <SlideErrorBoundary key={entry.key} label={errorLabel}>
          {entry.element}
        </SlideErrorBoundary>
      </SlidePositionProvider>
    </div>
  );
}
