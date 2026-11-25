"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

import { publish, whenSettled } from "@/slides/player/check/ready";
import { DeckSlide } from "@/slides/player/deck-slide";

import type { ViewProps } from "./chrome";

/**
 * Marks the document as nothing but a deck while a view is mounted (`data-slides-document` on
 * <html>): slides.css then names every page of it, and Chromium adds no empty page at the end.
 */
export function useSlidesDocument(): void {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-slides-document", "");
    return () => root.removeAttribute("data-slides-document");
  }, []);
}

/**
 * The deck as it prints: every slide at its own size, one under the other, one a page
 * (`page.pdf({ preferCSSPageSize: true, printBackground: true })` in Chromium). Nothing else is
 * on the page. `window.__slidesReady` resolves once the fonts and pictures are there.
 */
export function PrintView({ entries, labels, lang }: ViewProps) {
  const deck = useRef<HTMLDivElement>(null);
  useSlidesDocument();

  useEffect(() => {
    const element = deck.current;
    if (!element) return;
    let current = true;
    void whenSettled(element).then(() => {
      if (current) publish(undefined);
    });
    return () => {
      current = false;
    };
  }, [entries]);

  return (
    <div ref={deck} data-slot="deck" lang={lang} className="flex w-max flex-col">
      {entries.map((entry, index) => (
        <DeckSlide key={entry.key} entry={entry} index={index} errorLabel={labels.slideError} />
      ))}
    </div>
  );
}
