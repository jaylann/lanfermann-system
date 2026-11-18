"use client";

import { type RefObject, useLayoutEffect } from "react";

/** Where an element stands inside a box that is one of its positioned ancestors. */
function offsetWithin(element: HTMLElement, box: HTMLElement) {
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = element;
  while (node && node !== box) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left, top };
}

export type TravellingMarkOptions = {
  /** Which entry inside the list the mark stands on. */
  current?: string;
  /**
   * The name of an attribute that a part of the list carries while it opens or closes
   * (`data-folding`). An entry inside such a part is clipped by it, which the mark cannot be:
   * for that time the mark is gone and the entry wears the look itself.
   */
  still?: string;
  /** Set to `false` for a list whose entries wear the mark themselves. */
  enabled?: boolean;
};

/**
 * Keeps one mark on the current entry of a list and lets it travel when another entry becomes
 * current: the tint of a `Sidebar`, the tint under a page number. "The mark travels" (DESIGN.md).
 *
 * `listRef` is the positioned box that holds the entries and the mark. The mark is placed from the
 * entry's measured offsets (layout pixels, so it is right under `zoom`), which are written onto
 * it as `--mark-x`, `--mark-y`, `--mark-w` and `--mark-h`; the `travels` utility (travel.css)
 * moves it by `translate`. Nothing renders: the list is watched for the entry that says it is
 * current.
 *
 * What the stylesheet reads:
 *
 *   `data-shown` on the mark     an entry is current and laid out; without it the mark fades
 *   `data-placed` on the list    the mark has taken over. Until then (on the server, before the
 *                                first measure) the current entry wears the same look itself,
 *                                so nothing appears late.
 *   `data-settling` on the list  the layout is moving under the mark (a group folds, the list
 *                                narrows). The mark then follows without a transition: one that
 *                                is given a new goal on every frame never arrives.
 */
export function useTravellingMark(
  listRef: RefObject<HTMLElement | null>,
  markRef: RefObject<HTMLElement | null>,
  { current = '[aria-current="page"]', still, enabled = true }: TravellingMarkOptions = {},
) {
  useLayoutEffect(() => {
    const box = listRef.current;
    const piece = markRef.current;
    if (!enabled || !box || !piece) return;
    let frame = 0;

    const place = () => {
      const entry = box.querySelector<HTMLElement>(current);
      // An entry inside a folded group is not laid out and has no place; one inside a group
      // that is folding right now wears the look itself.
      if (!entry || entry.offsetParent === null || (still && entry.closest(`[${still}]`))) {
        delete piece.dataset.shown;
        return;
      }
      const { left, top } = offsetWithin(entry, box);
      piece.style.setProperty("--mark-x", `${left}px`);
      piece.style.setProperty("--mark-y", `${top}px`);
      piece.style.setProperty("--mark-w", `${entry.offsetWidth}px`);
      piece.style.setProperty("--mark-h", `${entry.offsetHeight}px`);
      piece.dataset.shown = "";
    };

    /** Follows a layout that moves, or takes the first place: without a transition. */
    const settle = () => {
      box.dataset.settling = "";
      place();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        delete box.dataset.settling;
      });
    };

    settle();
    box.dataset.placed = "";

    // Another entry says it is current, or entries come and go: the mark travels. A part that
    // starts or stops folding hands the look over, which must not be seen: no transition.
    const changed = new MutationObserver((records) => {
      if (still && records.some((record) => record.attributeName === still)) settle();
      else place();
    });
    changed.observe(box, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: still ? ["aria-current", still] : ["aria-current"],
    });
    const resized = new ResizeObserver(settle);
    resized.observe(box);

    return () => {
      cancelAnimationFrame(frame);
      changed.disconnect();
      resized.disconnect();
      delete box.dataset.placed;
      delete box.dataset.settling;
      delete piece.dataset.shown;
    };
  }, [listRef, markRef, current, still, enabled]);
}
