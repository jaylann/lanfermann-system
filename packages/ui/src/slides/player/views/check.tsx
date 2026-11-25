"use client";

import { isValidElement, type ReactNode, useEffect, useRef } from "react";

import { measureEntry } from "@/slides/player/check/measure";
import { collectErrors, fontsOfPage, publish, whenSettled } from "@/slides/player/check/ready";
import { buildReport, type SlideIssue } from "@/slides/player/check/report";
import { DeckSlide } from "@/slides/player/deck-slide";
import { version } from "@/slides/player/version";

import type { ViewProps } from "./chrome";
import { useSlidesDocument } from "./print";

type CheckViewProps = ViewProps & {
  /** The deck's title, for the report. */
  title: ReactNode;
};

/** The words of a title, without its markup. A line break counts as a space. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (!isValidElement<{ children?: ReactNode }>(node)) return "";
  return node.type === "br" ? " " : textOf(node.props.children);
}

/**
 * The deck laid out as it prints, then measured: once the fonts and pictures are there, every
 * slide is checked (see check/measure.ts) and the report is written to `window.__slidesReport`;
 * `window.__slidesReady` resolves with it. Each child of the deck stands in a box that takes no
 * space (`data-slides-entry`), so the report can say which child is not one slide.
 */
export function CheckView({ entries, labels, lang, title }: CheckViewProps) {
  const deck = useRef<HTMLDivElement>(null);
  useSlidesDocument();

  useEffect(() => {
    const element = deck.current;
    if (!element) return;
    let current = true;
    const page = collectErrors();
    void whenSettled(element).then(() => {
      if (!current) return;
      const slides = entries.map((entry, index) => {
        const box = element.querySelector(`[data-slides-entry="${index}"]`);
        const issues: SlideIssue[] = box
          ? measureEntry(box)
          : [{ kind: "structure", message: "The child was not drawn." }];
        return entry.id === undefined ? { index, issues } : { index, id: entry.id, issues };
      });
      publish(
        buildReport({
          kit: version,
          deck: { title: textOf(title), lang, slides: entries.length },
          fonts: fontsOfPage(),
          slides,
          errors: page.errors,
        }),
      );
    });
    return () => {
      current = false;
      page.stop();
    };
  }, [entries, lang, title]);

  return (
    <div ref={deck} data-slot="deck" lang={lang} className="flex w-max flex-col">
      {entries.map((entry, index) => (
        <div key={entry.key} data-slides-entry={index} className="contents">
          <DeckSlide entry={entry} index={index} errorLabel={labels.slideError} />
        </div>
      ))}
    </div>
  );
}
