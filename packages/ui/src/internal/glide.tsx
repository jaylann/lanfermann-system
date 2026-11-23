"use client";

import { Component, type RefObject, type TransitionEvent, useEffect, useRef } from "react";

import { springs } from "@/motion/springs";

import type { Place } from "./presence";

/** Where a part was seen, by its key: its corner relative to the box it glides in. */
export type Positions = ReadonlyMap<string, { x: number; y: number }>;

/** How far a part has to be put back to stand where it was seen. */
export type Move = { key: string; x: number; y: number };

/**
 * The parts that changed place, and by how much: what was seen before less where it stands now.
 * A part that is new, or moved by less than half a pixel, does not glide.
 */
export function movesBetween(before: Positions, after: Positions): Move[] {
  const moves: Move[] = [];
  for (const [key, now] of after) {
    const was = before.get(key);
    if (!was) continue;
    const x = was.x - now.x;
    const y = was.y - now.y;
    if (Math.abs(x) >= 0.5 || Math.abs(y) >= 0.5) moves.push({ key, x, y });
  }
  return moves;
}

/**
 * The transitions of a part that joins, leaves and glides inside a box: it fades in on `settle`
 * where it joins (only once the box is live, so what is there on load stands still, and only
 * when it carries `data-joining`, so what React merely moves does not fade in again), fades on
 * `leave` where it goes, and glides to a new place on `glide`, without bounce or scale. Opacity
 * comes first in the list: while a part is being put back, only it keeps its transition.
 */
export const glidePlace = [
  "[transition:opacity_var(--transition-duration-spring-settle)_var(--ease-spring-settle),translate_var(--transition-duration-spring-glide)_var(--ease-spring-glide)]",
  "in-data-live:data-joining:starting:opacity-0",
  "data-leaving:opacity-0",
  "data-leaving:[transition:opacity_var(--transition-duration-spring-leave)_var(--ease-spring-leave),translate_var(--transition-duration-spring-glide)_var(--ease-spring-glide)]",
].join(" ");

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * The glide of the parts of one box (a grid of tiles, the rows of a table) when what it holds
 * changes: what stays closes up or makes room by moving to its new place with a transform, so
 * nothing is laid out while it moves. Every part carries `data-glide` with a key of its own.
 *
 * It is told about a change twice by a `GlideFrame`: once before React writes the change into
 * the page (`read`, where each part is seen, its running glide included) and once after it
 * (`play`). Several frames in one box share one reading per change, and the first to play it
 * plays it for all. Under reduced motion nothing glides: parts stand in their new place at once.
 */
export class Glide {
  private taken: Positions | null = null;

  constructor(private readonly box: RefObject<HTMLElement | null>) {}

  private parts(): HTMLElement[] {
    return [...(this.box.current?.querySelectorAll<HTMLElement>("[data-glide]") ?? [])];
  }

  private where(parts: readonly HTMLElement[]): Map<string, { x: number; y: number }> {
    const origin = this.box.current?.getBoundingClientRect();
    const seen = new Map<string, { x: number; y: number }>();
    if (!origin) return seen;
    for (const part of parts) {
      const key = part.dataset.glide;
      if (!key) continue;
      const box = part.getBoundingClientRect();
      seen.set(key, { x: box.left - origin.left, y: box.top - origin.top });
    }
    return seen;
  }

  /** Where every part is seen now. Called before a change is written into the page. */
  read(): Positions | null {
    if (window.matchMedia(REDUCED).matches) return null;
    this.taken ??= this.where(this.parts());
    return this.taken;
  }

  /**
   * After the change: every part that was seen elsewhere is put back there at once and let go,
   * so it glides to its new place. A part that is leaving keeps its fade and does not move; one
   * that is new fades in where it belongs.
   */
  play(before: Positions): void {
    if (before !== this.taken) return;
    this.taken = null;
    const parts = this.parts().filter(
      (part) =>
        part.dataset.glide && before.has(part.dataset.glide) && !("leaving" in part.dataset),
    );
    if (parts.length === 0) return;
    // Lift each glide that is still running, so the new places are read as they are laid out.
    for (const part of parts) {
      part.style.transitionProperty = "opacity";
      part.style.translate = "none";
    }
    const moves = new Map(movesBetween(before, this.where(parts)).map((move) => [move.key, move]));
    // Put each part back where it was seen, at once.
    for (const part of parts) {
      const move = moves.get(part.dataset.glide ?? "");
      if (move) part.style.translate = `${move.x}px ${move.y}px`;
    }
    // The page has to stand there for a frame's style, or there is nothing to glide from.
    void this.box.current?.offsetWidth;
    for (const part of parts) {
      part.style.transitionProperty = "";
      part.style.translate = "";
    }
  }
}

type GlideFrameProps = {
  glide: Glide;
  /** What the box holds, as one string that changes when a part joins, leaves or moves. */
  change: string;
};

/**
 * Tells a `Glide` about a change of what a box holds: it reads the parts before React writes
 * the change (`getSnapshotBeforeUpdate`, which runs before any of the page is changed) and lets
 * them glide after. A class, because only a class can look at the page before an update. Put it
 * anywhere inside the part of the tree that re-renders with the change; it draws nothing.
 */
export class GlideFrame extends Component<GlideFrameProps> {
  override getSnapshotBeforeUpdate(previous: GlideFrameProps): Positions | null {
    return previous.change === this.props.change ? null : this.props.glide.read();
  }

  override componentDidUpdate(
    _previous: GlideFrameProps,
    _state: unknown,
    before: Positions | null,
  ): void {
    if (before) this.props.glide.play(before);
  }

  override render(): null {
    return null;
  }
}

/** The order of the places of a box, as a `GlideFrame`'s `change`. */
export function placesChange(places: readonly Place<unknown>[]): string {
  return places.map((place) => place.key).join("\n");
}

/**
 * Only the fade says a place has left: a glide that ends on a place that is leaving (it was
 * still moving when it was taken out) must not drop it before it has faded.
 */
export function onFaded(
  handler: (event: TransitionEvent<HTMLElement>) => void,
): (event: TransitionEvent<HTMLElement>) => void {
  return (event) => {
    if (event.propertyName === "opacity") handler(event);
  };
}

/** When a fade on `leave` looks finished: its curve settles for twice as long, unseen. */
const FADED_MS = springs.leave.visualDuration * 1000;

/**
 * Takes the places that are leaving out once their fade looks finished, not when its unseen
 * tail ends: the rest can only glide into a place once it is empty, and waiting for the tail
 * left the gap standing for a moment with nothing in it. Their own `transitionend` still takes
 * them out if it comes first.
 */
export function useLeaveWhenFaded(
  places: readonly Place<unknown>[],
  left: (key: string) => void,
): void {
  const leave = useRef(left);
  useEffect(() => {
    leave.current = left;
  });
  const leaving = places
    .filter((place) => place.leaving)
    .map((place) => place.key)
    .join("\n");
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => {
      for (const key of leaving.split("\n")) leave.current(key);
    }, FADED_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);
}
