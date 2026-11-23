"use client";

import { type RefObject, type TransitionEvent, useEffect, useState } from "react";

/**
 * Whether a list has stood for a frame. Page load does not animate: what is there when a list
 * first shows stands still, and only what joins afterwards comes in. Put the result on the list
 * as `data-live` and gate the entrance with `in-data-live:starting:*`.
 */
export function useLive(): boolean {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return live;
}

/** One place of a row or a list: what stands in it, and whether that is on its way out. */
export type Place<Item> = {
  item: Item;
  key: string;
  leaving: boolean;
  /**
   * New since the owner's list last changed. An entrance gated on it (`data-joining`) plays for
   * what joins and not for what React only moves: a moved element is put into the page again,
   * and `@starting-style` would fade it in from nothing as if it were new.
   */
  joining: boolean;
};

/** Something its owner has stopped rendering, kept until it has left, and where it stood. */
type Leaver<Item> = { item: Item; key: string; index: number };

/**
 * The items of a row, and with them those that were just taken out of it: what its owner removes
 * is kept where it stood until it has left, so it can fade and its place can close. The owner's
 * list is already without it; only the picture lags.
 *
 * Draw every place with `placeProps`, inside the box of `boxRef`: a place says when its
 * transition has ended, and the hook finds the places that never started one.
 *
 * Hand it the same array for as long as nothing changed: memoise a list made from `children`
 * on `children`. The hook keeps the list as it was last drawn, so what leaves goes as it last
 * looked (a file removed mid-upload, not as it stood when the list last gained or lost one),
 * and a new array every render would never let it settle.
 */
export function usePresence<Item>(
  items: readonly Item[],
  keyOf: (item: Item) => string,
  boxRef: RefObject<HTMLElement | null>,
) {
  const [before, setBefore] = useState(items);
  const [leavers, setLeavers] = useState<readonly Leaver<Item>[]>([]);
  const [joined, setJoined] = useState<ReadonlySet<string>>(() => new Set());

  // Compared while rendering, as React asks for state that follows a prop.
  const keys = items.map(keyOf);
  if (before !== items) {
    const was = before.map(keyOf);
    if (was.join("\n") !== keys.join("\n")) {
      const stays = new Set(keys);
      const gone = before
        .map((item, index) => ({ item, key: keyOf(item), index }))
        .filter(({ key }) => !stays.has(key));
      // What comes back while it is leaving is simply there again.
      setLeavers((old) => [...old.filter(({ key }) => !stays.has(key)), ...gone]);
      const known = new Set(was);
      setJoined(new Set(keys.filter((key) => !known.has(key))));
    }
    setBefore(items);
  }

  // A place says when its transition has ended (`left`). Where none runs at all, nothing would
  // ever say so: a frame after something was marked as leaving, whatever is not moving is
  // dropped. It is asked of the place and not timed, so a transition that is held is waited for.
  useEffect(() => {
    if (leavers.length === 0) return;
    const frame = requestAnimationFrame(() => {
      const moving = new Set<string | undefined>();
      boxRef.current?.querySelectorAll<HTMLElement>("[data-leaving][data-key]").forEach((place) => {
        if (place.getAnimations().length > 0) moving.add(place.dataset.key);
      });
      setLeavers((old) => {
        const next = old.filter(({ key }) => moving.has(key));
        return next.length === old.length ? old : next;
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [leavers, boxRef]);

  const left = (key: string) => setLeavers((old) => old.filter((leaver) => leaver.key !== key));

  const places: Place<Item>[] = items.map((item, index) => ({
    item,
    key: keys[index] ?? "",
    leaving: false,
    joining: joined.has(keys[index] ?? ""),
  }));
  for (const { item, key, index } of leavers) {
    places.splice(Math.min(index, places.length), 0, {
      item,
      key,
      leaving: true,
      joining: false,
    });
  }
  return { places, left };
}

/**
 * What every place carries: its key, whether it is leaving, and the two events that say it has
 * left. What has left the owner's list can no longer be pressed or focused (`inert`).
 */
export function placeProps(place: Place<unknown>, left: (key: string) => void) {
  const ended = (event: TransitionEvent<HTMLElement>) => {
    if (place.leaving && event.target === event.currentTarget) left(place.key);
  };
  return {
    "data-key": place.key,
    "data-leaving": place.leaving ? "" : undefined,
    inert: place.leaving,
    onTransitionEnd: ended,
    onTransitionCancel: ended,
  };
}

/**
 * A place in a row: a grid of one column that opens from nothing and closes to nothing. What
 * stands in it keeps its size all the while; only its place changes, which moves its
 * neighbours. The row's gap is the variable `--chip-gap`, because a place that closes has to
 * take its gap with it. What stands inside has faded before the place closes (the delay), so it
 * is never seen under a neighbour.
 */
export const placeInRow = [
  "inline-grid grid-cols-[1fr] transition-[grid-template-columns,margin] spring-settle",
  "in-data-live:starting:-mr-(--chip-gap) in-data-live:starting:grid-cols-[0fr]",
  "data-leaving:-mr-(--chip-gap) data-leaving:grid-cols-[0fr] data-leaving:delay-75",
].join(" ");
