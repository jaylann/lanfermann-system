"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { DeckProvider, SlidePositionProvider } from "./deck-context";
import { flattenSlides } from "./flatten-slides";

export type DeckProps = Omit<ComponentProps<"div">, "title"> & {
  /** The deck's title in sentence case. It stands in the footer row of every content slide. */
  title: ReactNode;
  /** The language the deck is written in, as a BCP 47 tag. German by default. */
  lang?: string;
  /** The slides, one per child: `Slide`, or a slide kind such as `CoverSlide`. */
  children: ReactNode;
};

/**
 * A deck: its slides in order, with the title and the page numbers their footer rows show.
 *
 * Rendered as it is, the slides stand one under the other at the canvas's size (1920 by 1080),
 * which is also how a deck prints: one slide a page. To show one slide scaled to a box, put it in
 * a `Stage`; to present a deck, hand it to the player.
 */
export function Deck({ title, lang = "de", className, children, ...props }: DeckProps) {
  const slides = flattenSlides(children);
  return (
    <DeckProvider title={title} count={slides.length}>
      <div data-slot="deck" lang={lang} className={cn("flex w-max flex-col", className)} {...props}>
        {slides.map((slide, index) => (
          <SlidePositionProvider key={slide.key} index={index}>
            {slide.element}
          </SlidePositionProvider>
        ))}
      </div>
    </DeckProvider>
  );
}
