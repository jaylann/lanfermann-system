"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

import { SlidePositionProvider } from "@/slides/deck/deck-context";
import type { SlideEntry } from "@/slides/deck/flatten-slides";
import { SlideStepProvider } from "@/slides/step/step-context";

import { SlideErrorBoundary } from "./error-boundary";

type DeckSlideProps = {
  entry: SlideEntry;
  /** Counted from 0. */
  index: number;
  /** The line a slide that threw is replaced by. */
  errorLabel: string;
  /**
   * The step to show the slide at, from 0. Without it the slide shows all its steps: the grid,
   * the print and the check.
   */
  step?: number;
  /**
   * Whether the slide is being presented (the audience's slide, the console's current one): only
   * then does the stylesheet move anything. A preview stands still.
   */
  live?: boolean;
};

/**
 * One slide of the deck as every view of the player draws it: it knows its page, its step, and its
 * failure stays its own. The deck's title and count come from the `DeckProvider` around the view.
 *
 * The child stands in a box that takes no space (`data-slides-entry`), and the slide it draws is
 * marked with `data-slide-index` and, where it has one, `data-slide-id`: a tool that takes a
 * picture of each slide matches it to the check's report by these, not by its place in the page
 * (the hub's contract, issue #88). `Slide` is plain markup and does not know its place, so the
 * marks are written here, before the first paint.
 *
 * With a `step` the slide stands in a `SlideStepProvider` inside that box. Without one there is no
 * such box at all, so the slide is the entry's own child, as the print's page rules expect.
 *
 * A view that shows one slide after another keys this by `entry.key`: a new slide is mounted
 * fresh (its entrance runs once), a new step of the same slide only changes `step`.
 */
export function DeckSlide({ entry, index, errorLabel, step, live = false }: DeckSlideProps) {
  const box = useRef<HTMLDivElement>(null);

  // On every render: a slide that threw and was drawn again is a new element.
  useLayoutEffect(() => {
    for (const slide of box.current?.querySelectorAll('[data-slot="slide"]') ?? []) {
      slide.setAttribute("data-slide-index", String(index));
      if (entry.id === undefined) slide.removeAttribute("data-slide-id");
      else slide.setAttribute("data-slide-id", entry.id);
    }
  });

  const slide: ReactNode = (
    <SlideErrorBoundary key={entry.key} label={errorLabel}>
      {entry.element}
    </SlideErrorBoundary>
  );

  return (
    <div ref={box} data-slides-entry={index} className="contents">
      <SlidePositionProvider index={index}>
        {step === undefined ? (
          slide
        ) : (
          <SlideStepProvider step={step} steps={entry.steps} live={live}>
            {slide}
          </SlideStepProvider>
        )}
      </SlidePositionProvider>
    </div>
  );
}
