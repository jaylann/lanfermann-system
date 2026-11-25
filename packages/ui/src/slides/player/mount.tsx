"use client";

import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";

import type { DeckProps } from "@/slides/deck/deck";

import type { PlayerLabels } from "./labels";
import { modeFromSearch, type PlayerMode, sessionFromSearch } from "./mode";
import { Player } from "./player";

export type MountOptions = {
  /** The element the player is drawn into. By default the one with the id `lf-slides`, which is
   * added to <body> if the page has none. */
  target?: Element;
  /** The mode the page opens in. `audience` by default. */
  mode?: PlayerMode;
  /**
   * The modes `?mode=` in the address may pick, besides `mode` itself. By default all but the
   * presenter's console: a file for an audience holds no notes, and says so by not offering it.
   */
  modes?: readonly PlayerMode[];
  /** The address of the deck as a PDF. With it the audience's controls offer „PDF laden“. */
  pdf?: string;
  /** The player's own words, where they differ from the German defaults. */
  labels?: Partial<PlayerLabels>;
  /**
   * Whether the page is a frame of another page, which then moves the deck and owns the
   * audience's window (see `Player`). By default the page is asked.
   */
  embed?: boolean;
};

const TARGET_ID = "lf-slides";
const DEFAULT_MODES: readonly PlayerMode[] = ["audience", "print", "check"];

/**
 * Puts a deck on a page of its own: draws the player into `target` in the mode the build and the
 * page's address agree on. This is what a deck's one HTML file calls.
 *
 * `unmount` takes the player off the page again, and with it the element this call added.
 */
export function mount(
  deck: ReactElement<DeckProps>,
  { target, mode = "audience", modes = DEFAULT_MODES, pdf, labels, embed }: MountOptions = {},
): { unmount(): void } {
  let added: Element | undefined;
  let element = target ?? document.getElementById(TARGET_ID);
  if (!element) {
    added = document.createElement("div");
    added.id = TARGET_ID;
    document.body.append(added);
    element = added;
  }
  const { search } = window.location;
  const root = createRoot(element);
  root.render(
    <Player
      deck={deck}
      mode={modeFromSearch(search, mode, modes)}
      pdf={pdf}
      labels={labels}
      session={sessionFromSearch(search)}
      embed={embed}
    />,
  );
  return {
    unmount() {
      root.unmount();
      added?.remove();
    },
  };
}
