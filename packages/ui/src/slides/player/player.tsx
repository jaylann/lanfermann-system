"use client";

import { type ReactElement, type ReactNode, useMemo } from "react";

import type { DeckProps } from "@/slides/deck/deck";
import { DeckProvider } from "@/slides/deck/deck-context";
import { flattenSlides } from "@/slides/deck/flatten-slides";

import type { PlayerStart } from "./hooks";
import { defaultLabels, type PlayerLabels } from "./labels";
import type { PlayerMode } from "./mode";
import { AudienceView } from "./views/audience";
import { CheckView } from "./views/check";
import { PresenterView } from "./views/presenter";
import { PrintView } from "./views/print";

export type PlayerProps = {
  /** The deck: a `<Deck>` element. The player lays its slides out itself. */
  deck: ReactElement<DeckProps>;
  /**
   * How the deck is shown. `audience` (default): one slide, as large as the window. `presenter`:
   * the console with the next slide, the notes and the clock. `print`: every slide at its own
   * size, one a page. `check`: the print layout, measured, with a report on
   * `window.__slidesReport`.
   */
  mode?: PlayerMode;
  /** The address of the deck as a PDF. With it the audience's controls offer „PDF laden“. */
  pdf?: string;
  /** The player's own words, where they differ from the German defaults. */
  labels?: Partial<PlayerLabels>;
  /**
   * The session of a presenter's window. An audience's window that is given one follows that
   * presenter instead of moving itself; a presenter's window makes its own.
   */
  session?: string;
  /** Where the deck starts: the slide (from 0), the black screen, the grid, the talk's clock. */
  start?: PlayerStart;
  /** Whether the address (`#/7`) follows the slide and moves it. True by default. */
  hash?: boolean;
  /** The time in ms since the epoch, `Date.now` by default. A test hands in a clock that stands. */
  now?: () => number;
};

/**
 * Presents a deck: the audience's view, the presenter's console, the print layout or the check.
 * It fills the window (`h-dvh w-dvw`), so it is the page, not a part of one; `mount` puts it
 * there for a deck that is a file of its own.
 *
 * Every slide stands in the deck's context (title, page) and in an error boundary of its own: a
 * slide that throws shows a plain note, and the deck goes on.
 */
export function Player({
  deck,
  mode = "audience",
  pdf,
  labels,
  session,
  start,
  hash = true,
  now = Date.now,
}: PlayerProps): ReactNode {
  const { title, lang = "de", children } = deck.props;
  const entries = useMemo(() => flattenSlides(children), [children]);
  const words = useMemo(() => ({ ...defaultLabels, ...labels }), [labels]);
  const shared = { entries, labels: words, lang };

  return (
    <DeckProvider title={title} count={entries.length}>
      {view()}
    </DeckProvider>
  );

  function view(): ReactNode {
    switch (mode) {
      case "audience":
        return (
          <AudienceView
            {...shared}
            pdf={pdf}
            session={session}
            start={start}
            now={now}
            hash={hash}
          />
        );
      case "presenter":
        return <PresenterView {...shared} session={session} start={start} now={now} hash={hash} />;
      case "print":
        return <PrintView {...shared} />;
      case "check":
        return <CheckView {...shared} title={title} />;
      default:
        return mode satisfies never;
    }
  }
}
