"use client";

import { type KeyboardEvent, useEffect, useRef } from "react";

import { tileOfKey } from "@/slides/player/actions";
import { DeckSlide } from "@/slides/player/deck-slide";
import { fill } from "@/slides/player/labels";
import { Stage } from "@/slides/stage/stage";

import { BlockHead, KeyHint, textButton, type ViewProps } from "./chrome";

type GridProps = ViewProps & {
  /** The slide shown, counted from 0: its tile is marked and takes the focus. */
  current: number;
  /** A tile was chosen. */
  onPick: (index: number) => void;
  onClose: () => void;
};

/**
 * Every slide of the deck as a small picture, to jump: an overlay inside the console that takes
 * the focus like a dialog. The arrows walk the tiles, Enter goes to the one in focus, Escape
 * closes; the keys that step the deck (a clicker) still do, and close it too.
 */
export function Grid({ entries, labels, current, onPick, onClose }: GridProps) {
  const list = useRef<HTMLOListElement>(null);
  // The slide shown when the grid opened: its tile takes the focus once, and afterwards the
  // focus is the presenter's.
  const opened = useRef(current);

  const tiles = () => Array.from(list.current?.querySelectorAll("button") ?? []);

  useEffect(() => {
    list.current?.querySelectorAll("button")[opened.current]?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const all = tiles();
    const from = all.findIndex((tile) => tile === document.activeElement);
    if (from === -1) return;
    // As many tiles stand in a row as share the first one's top.
    const top = all[0]?.getBoundingClientRect().top;
    const columns = all.filter((tile) => tile.getBoundingClientRect().top === top).length;
    const to = tileOfKey(event.key, from, all.length, columns);
    if (to === undefined) return;
    // Handled here, also at the grid's edge: on the window these keys would step the deck.
    event.preventDefault();
    all[to]?.focus();
  };

  return (
    <div
      data-slot="player-grid"
      role="dialog"
      aria-modal="true"
      aria-label={labels.grid}
      className="absolute inset-0 flex flex-col bg-ground p-6"
    >
      <BlockHead
        aside={
          <button type="button" className={`${textButton} gap-2`} onClick={onClose}>
            {labels.closeGrid}
            <KeyHint>Esc</KeyHint>
          </button>
        }
      >
        {labels.grid}
      </BlockHead>
      <ol
        ref={list}
        onKeyDown={onKeyDown}
        // The padding (taken back by the margin) keeps a tile's focus ring from being cut off by
        // the box that scrolls.
        className="-m-2 grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-x-6 gap-y-4 overflow-y-auto p-2"
      >
        {entries.map((entry, index) => (
          <li key={entry.key}>
            <div className="relative">
              <div inert className="border border-line">
                <Stage>
                  <DeckSlide entry={entry} index={index} errorLabel={labels.slideError} />
                </Stage>
              </div>
              {/* Over the picture, which is not to be reached itself: one tile, one button. The
                  current slide's tile is framed in the accent; the focus stands off it. */}
              <button
                type="button"
                aria-label={fill(labels.gridSlide, { page: index + 1 })}
                aria-current={index === current ? "true" : undefined}
                onClick={() => onPick(index)}
                className="absolute inset-0 outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 aria-[current=true]:border-2 aria-[current=true]:border-accent"
              />
            </div>
            <p
              aria-hidden="true"
              data-current={index === current ? "" : undefined}
              className="pt-2 text-sm text-fg-muted tabular-nums data-current:font-medium data-current:text-accent"
            >
              {index + 1}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
