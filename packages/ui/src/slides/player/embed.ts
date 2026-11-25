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
 *     { lfSlides: "embed", type: "ready", count, slides: [{ id, steps }] }          once, first
 *     { lfSlides: "embed", type: "state", index, count, id, step, steps, blackout } on every change
 *     { lfSlides: "embed", type: "intent", intent: "audience-window" }              the console's button
 *   in, taken only when `event.source === window.parent` (the one check there is, on both sides):
 *     { lfSlides: "embed", type: "go", index, step?, blackout? }
 *     { lfSlides: "embed", type: "intent", intent }
 *
 * `blackout` on `go` is an addition to the contract: with it the framing page can hand a state it
 * was given by one frame to another as it is, where a `blackout` intent would only toggle.
 *
 * Steps are an addition too. `steps` is how many steps a slide shows click by click (0: none),
 * `step` where the shown slide stands among them (0 to `steps`). A `next` intent walks the steps
 * before it leaves a slide; `go` lands on step 0 unless it names one (clamped to the slide's).
 * A state carries a change of step as well, with the same `index`.
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
  | { type: "go"; index: number; step?: number; blackout?: boolean }
  | { type: "intent"; intent: EmbedIntent };

export type EmbedState = {
  /** The slide shown, counted from 0. */
  index: number;
  count: number;
  /** The shown slide's id, if it has one. */
  id?: string;
  /** Where the shown slide stands among its steps, from 0. */
  step: number;
  /** How many steps the shown slide has (0: it shows everything at once). */
  steps: number;
  blackout: boolean;
};

/** One slide as the first message lists it. */
export type EmbedSlide = { id?: string; steps: number };

const MARK = "embed";

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/**
 * Reads what the framing page sent. Anything that is not one of the two commands, whole and of
 * the right types, is `undefined`: other scripts post to frames too.
 */
export function parseEmbedCommand(data: unknown): EmbedCommand | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const record = data as Record<string, unknown>;
  if (record.lfSlides !== MARK) return undefined;
  if (record.type === "go") {
    const { index, step, blackout } = record;
    if (!isCount(index)) return undefined;
    if (step !== undefined && !isCount(step)) return undefined;
    if (blackout !== undefined && typeof blackout !== "boolean") return undefined;
    return {
      type: "go",
      index,
      ...(step === undefined ? {} : { step }),
      ...(blackout === undefined ? {} : { blackout }),
    };
  }
  if (record.type === "intent") {
    const { intent } = record;
    if (typeof intent !== "string" || !EMBED_INTENTS.includes(intent)) return undefined;
    // Checked against the list above.
    return { type: "intent", intent: intent as EmbedIntent };
  }
  return undefined;
}

/** The first message: how many slides there are, with their ids and steps in order. */
export function readyMessage(slides: readonly EmbedSlide[]) {
  return {
    lfSlides: MARK,
    type: "ready",
    count: slides.length,
    slides: slides.map(({ id, steps }) => (id === undefined ? { steps } : { id, steps })),
  } as const;
}

/** Where the deck is, as it is told on every change. */
export function stateMessage({ index, count, id, step, steps, blackout }: EmbedState) {
  return {
    lfSlides: MARK,
    type: "state",
    index,
    count,
    ...(id === undefined ? {} : { id }),
    step,
    steps,
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
  /** The deck's slides in order, with their ids and steps (a `SlideEntry` is one). */
  slides: readonly EmbedSlide[];
  index: number;
  step: number;
  blackout: boolean;
  onCommand: (command: EmbedCommand) => void;
};

/** Tells the framing page where the deck is, and takes its commands. Does nothing when not framed. */
export function useEmbed({
  enabled,
  slides,
  index,
  step,
  blackout,
  onCommand,
}: EmbedOptions): void {
  const handler = useLatest(onCommand);

  // Declared before the state's effect, so `ready` is the first message out.
  useEffect(() => {
    if (!enabled) return;
    post(readyMessage(slides));
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== window.parent) return;
      const command = parseEmbedCommand(event.data);
      if (command) handler.current(command);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled, slides, handler]);

  useEffect(() => {
    if (!enabled) return;
    const slide = slides[index];
    post(
      stateMessage({
        index,
        count: slides.length,
        id: slide?.id,
        step,
        steps: slide?.steps ?? 0,
        blackout,
      }),
    );
  }, [enabled, slides, index, step, blackout]);
}
