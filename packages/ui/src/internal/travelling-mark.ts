"use client";

import { type RefObject, useLayoutEffect } from "react";

import { atRest, type Moving, springForce, stepSpring } from "@/motion/spring-step";
import { springs } from "@/motion/springs";

/** Where an entry stands inside the list, and how large it is, in layout pixels. */
type Place = { x: number; y: number; w: number; h: number };

const sides = ["x", "y", "w", "h"] as const;

// Without bounce: a mark that overshoots would stand on its neighbour for a moment.
const force = springForce(springs.glide);

/** A tenth of a pixel from its place, and all but still: nobody sees the difference. */
const ARRIVED = 0.1;

/**
 * How long a fold may claim it has further to go without going there. Something sticks out of
 * it then (it is never as tall as what it holds), and the mark stops waiting for it.
 */
const STALLED_MS = 250;

/** Where an element stands inside a box that is one of its positioned ancestors. */
function placeWithin(element: HTMLElement, box: HTMLElement): Place {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== box) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: element.offsetWidth, h: element.offsetHeight };
}

export type TravellingMarkOptions = {
  /** Which entry inside the list the mark stands on. Of several, the first in the page. */
  current?: string;
  /**
   * The attribute by which an entry says it is the current one, as `current` reads it. The
   * list is watched for it: when it moves to another entry, the mark sets off.
   */
  attribute?: string;
  /**
   * The name of an attribute that a part of the list carries while it opens or closes
   * (`data-folding`). An entry inside such a part is clipped by it, which the mark cannot be:
   * for that time the mark is gone and the entry wears the look itself.
   */
  still?: string;
  /**
   * Which parts of the list fold open and shut by themselves while the mark may be on its way
   * (the subpages of an entry). Each is a box that clips and carries `data-open` while it is
   * open or opening. The mark then heads for where its entry will stand once they have
   * arrived, instead of running after an entry that is still sliding.
   */
  folds?: string;
  /** Set to `false` for a list whose entries wear the mark themselves. */
  enabled?: boolean;
};

/**
 * Keeps one mark on the current entry of a list and lets it travel when another entry becomes
 * current: the tint of a `Sidebar`, the tint under a page number. "The mark travels" (DESIGN.md).
 *
 * `listRef` is the positioned box that holds the entries and the mark. The mark's place is the
 * entry's measured offsets (layout pixels, so it is right under `zoom`), written onto it as
 * `--mark-x`, `--mark-y`, `--mark-w` and `--mark-h`; the `travels` utility (travel.css) turns
 * them into a box moved by `translate`. Nothing renders: the list is watched for the entry that
 * says it is current.
 *
 * The travel is a spring stepped by hand (`glide`), not a CSS transition, because the place it
 * travels to may itself be moving: the subpages of the entry it left fold away, and every entry
 * below slides up while the mark is on its way. A transition would have to be given a new goal
 * on every frame, and such a transition never arrives. The spring reads its goal anew each
 * frame and keeps its speed. For the parts named in `folds` it also knows how far they still
 * have to go, so its goal is where the entry will come to rest: it does not overshoot an entry
 * that comes towards it.
 *
 * At rest the mark is part of its entry: when the layout moves under it (a group folds, the
 * list narrows), it is set to the entry's new place at once, frame by frame.
 *
 * What the stylesheet reads:
 *
 *   `data-shown` on the mark    an entry is current and laid out; without it the mark fades
 *   `data-placed` on the list   the mark has taken over. Until then (on the server, before the
 *                               first measure) the current entry wears the same look itself,
 *                               so nothing appears late.
 */
export function useTravellingMark(
  listRef: RefObject<HTMLElement | null>,
  markRef: RefObject<HTMLElement | null>,
  {
    current = '[aria-current="page"]',
    attribute = "aria-current",
    still,
    folds,
    enabled = true,
  }: TravellingMarkOptions = {},
) {
  useLayoutEffect(() => {
    const box = listRef.current;
    const piece = markRef.current;
    if (!enabled || !box || !piece) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    /** Where the mark is right now, and how fast each of its sides moves. */
    let at: Record<keyof Place, Moving> | null = null;
    let frame = 0;
    let then = 0;
    /** What the folds last said they had to go, and when that last changed. */
    let lastRest = Number.NaN;
    let movedAt = 0;

    /** The entry the mark belongs on, if it has a place: laid out, and not inside a moving part. */
    const entryNow = () => {
      const entry = box.querySelector<HTMLElement>(current);
      if (!entry || entry.offsetParent === null) return null;
      if (still && entry.closest(`[${still}]`)) return null;
      return entry;
    };

    const goal = (): Place | null => {
      const entry = entryNow();
      return entry && placeWithin(entry, box);
    };

    /**
     * How far the entry still has to slide down (or, negative, up) until the parts that fold
     * above it have arrived: what each of them will be tall, less what it is tall now.
     */
    const stillToCome = (): number => {
      const entry = folds ? entryNow() : null;
      if (!entry || !folds) return 0;
      let rest = 0;
      for (const part of box.querySelectorAll<HTMLElement>(folds)) {
        const above = part.compareDocumentPosition(entry) & Node.DOCUMENT_POSITION_FOLLOWING;
        if (!above || part.contains(entry)) continue;
        // A box that clips knows how tall what it holds would be: its scroll height.
        rest += (part.hasAttribute("data-open") ? part.scrollHeight : 0) - part.offsetHeight;
      }
      return rest;
    };

    const draw = (place: Place) => {
      for (const side of sides) piece.style.setProperty(`--mark-${side}`, `${place[side]}px`);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    /** Stands on the entry at once: the first place, a layout that moved, reduced motion. */
    const seat = () => {
      stop();
      const place = goal();
      if (!place) {
        at = null;
        delete piece.dataset.shown;
        return;
      }
      at = { x: still0(place.x), y: still0(place.y), w: still0(place.w), h: still0(place.h) };
      draw(place);
      piece.dataset.shown = "";
    };

    const tick = (now: number) => {
      frame = 0;
      const place = goal();
      if (!place || !at) return seat();
      // Where the entry will stand, not where it is while the layout is still moving.
      let rest = stillToCome();
      if (rest !== lastRest) {
        lastRest = rest;
        movedAt = now;
      }
      if (now - movedAt > STALLED_MS) rest = 0;
      place.y += rest;
      const seconds = (now - then) / 1000;
      then = now;
      let arrived = Math.abs(rest) < ARRIVED;
      for (const side of sides) {
        at[side] = stepSpring(at[side], place[side], force, seconds);
        arrived &&= atRest(at[side], place[side], ARRIVED);
      }
      // Only once the layout has arrived as well: seated earlier, it would jump back to an
      // entry that is still on its way.
      if (arrived) return seat();
      // Nothing leaves its container: while the list itself narrows (a sidebar on its way to
      // the rail), the mark ends where the list ends, however far its own width still has to go.
      const w = Math.min(at.w.value, Math.max(0, box.offsetWidth - at.x.value));
      draw({ x: at.x.value, y: at.y.value, w, h: at.h.value });
      frame = requestAnimationFrame(tick);
    };

    /** Another entry is current: the mark sets off for it from where it stands. */
    const travel = () => {
      // Nowhere to come from (it was hidden), nowhere to go, or no travel wanted: it stands.
      if (!at || !goal() || reduced.matches) return seat();
      if (frame) return;
      then = movedAt = performance.now();
      lastRest = Number.NaN;
      frame = requestAnimationFrame(tick);
    };

    seat();
    box.dataset.placed = "";

    // An entry says it is current, or entries come and go: the mark travels. A part that starts
    // or stops folding hands the look over, which must not be seen: the mark stands at once.
    const changed = new MutationObserver((records) => {
      if (still && records.some((record) => record.attributeName === still)) seat();
      else travel();
    });
    changed.observe(box, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: still ? [attribute, still] : [attribute],
    });
    // The layout moved. On its way the mark reads its goal every frame anyway; at rest it is
    // part of its entry and moves with it.
    const resized = new ResizeObserver(() => {
      if (!frame) seat();
    });
    resized.observe(box);

    return () => {
      stop();
      changed.disconnect();
      resized.disconnect();
      delete box.dataset.placed;
      delete piece.dataset.shown;
    };
  }, [listRef, markRef, current, attribute, still, folds, enabled]);
}

/** A side that stands where it is. */
function still0(value: number): Moving {
  return { value, velocity: 0 };
}
