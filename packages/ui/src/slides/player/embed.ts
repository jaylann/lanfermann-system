"use client";

/**
 * The bridge to a page that frames the player (the hub does, in `<iframe sandbox="allow-scripts">`;
 * the contract is on issues #88 and #89).
 *
 * Such a frame has an origin of its own that cannot be named ("null"), so nothing that leans on an
 * origin works in it: no channel to a second window, no window of its own, no full screen. The
 * framing page takes those over, and the player only says where the deck is and does what it is
 * told:
 *
 *   out, to `parent`, addressed to "*" (an opaque origin cannot be named as a target):
 *     { lfSlides: "embed", type: "ready", count, slides: [{ id }] }             once, first
 *     { lfSlides: "embed", type: "state", index, count, id, blackout }          on every change
 *     { lfSlides: "embed", type: "intent", intent: "audience-window" }          the console's button
 *   in, taken only when `event.source === window.parent` (the one check there is, on both sides):
 *     { lfSlides: "embed", type: "go", index, blackout? }
 *     { lfSlides: "embed", type: "intent", intent }
 *
 * `blackout` on `go` is an addition to the contract: with it the framing page can hand a state it
 * was given by one frame to another as it is, where a `blackout` intent would only toggle.
 */
import { useEffect, useSyncExternalStore } from "react";

import { subscribeToNothing, useLatest } from "./hooks";
import type { PlayerIntent } from "./input";

/** What the framing page may ask for. The full screen is its own to give. */
export type EmbedIntent = Exclude<PlayerIntent, "fullscreen">;

const EMBED_INTENTS: readonly string[] = [
  "next",
  "previous",
  "first",
  "last",
  "blackout",
  "grid",
  "escape",
] satisfies EmbedIntent[];

export type EmbedCommand =
  { type: "go"; index: number; blackout?: boolean } | { type: "intent"; intent: EmbedIntent };

export type EmbedState = {
  /** The slide shown, counted from 0. */
  index: number;
  count: number;
  /** The shown slide's id, if it has one. */
  id?: string;
  blackout: boolean;
};

const MARK = "embed";

/**
 * Reads what the framing page sent. Anything that is not one of the two commands, whole and of
 * the right types, is `undefined`: other scripts post to frames too.
 */
export function parseEmbedCommand(data: unknown): EmbedCommand | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const record = data as Record<string, unknown>;
  if (record.lfSlides !== MARK) return undefined;
  if (record.type === "go") {
    const { index, blackout } = record;
    if (typeof index !== "number" || !Number.isSafeInteger(index) || index < 0) return undefined;
    if (blackout === undefined) return { type: "go", index };
    return typeof blackout === "boolean" ? { type: "go", index, blackout } : undefined;
  }
  if (record.type === "intent") {
    const { intent } = record;
    if (typeof intent !== "string" || !EMBED_INTENTS.includes(intent)) return undefined;
    // Checked against the list above.
    return { type: "intent", intent: intent as EmbedIntent };
  }
  return undefined;
}

/** The first message: how many slides there are, and their ids in order. */
export function readyMessage(ids: readonly (string | undefined)[]) {
  return {
    lfSlides: MARK,
    type: "ready",
    count: ids.length,
    slides: ids.map((id) => (id === undefined ? {} : { id })),
  } as const;
}

/** Where the deck is, as it is told on every change. */
export function stateMessage({ index, count, id, blackout }: EmbedState) {
  return {
    lfSlides: MARK,
    type: "state",
    index,
    count,
    ...(id === undefined ? {} : { id }),
    blackout,
  } as const;
}

function post(message: object): void {
  // "*": the frame cannot name its parent's origin when its own is opaque, and what is sent is a
  // slide number and the deck's own ids.
  window.parent.postMessage(message, "*");
}

/** Asks the framing page to open the audience's window: the frame cannot open one. */
export function askForAudienceWindow(): void {
  post({ lfSlides: MARK, type: "intent", intent: "audience-window" });
}

/**
 * Whether the player runs in a frame. `embed` settles it where it is given (a build that knows,
 * a story that wants the player as it stands alone); otherwise the page is asked.
 */
export function useEmbedded(embed: boolean | undefined): boolean {
  const framed = useSyncExternalStore(
    subscribeToNothing,
    () => window.parent !== window,
    () => false,
  );
  return embed ?? framed;
}

type EmbedOptions = {
  enabled: boolean;
  ids: readonly (string | undefined)[];
  index: number;
  blackout: boolean;
  onCommand: (command: EmbedCommand) => void;
};

/** Tells the framing page where the deck is, and takes its commands. Does nothing when not framed. */
export function useEmbed({ enabled, ids, index, blackout, onCommand }: EmbedOptions): void {
  const handler = useLatest(onCommand);

  // Declared before the state's effect, so `ready` is the first message out.
  useEffect(() => {
    if (!enabled) return;
    post(readyMessage(ids));
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== window.parent) return;
      const command = parseEmbedCommand(event.data);
      if (command) handler.current(command);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled, ids, handler]);

  useEffect(() => {
    if (!enabled) return;
    post(stateMessage({ index, count: ids.length, id: ids[index], blackout }));
  }, [enabled, ids, index, blackout]);
}
