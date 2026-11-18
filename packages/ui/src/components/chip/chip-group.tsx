"use client";

import {
  Children,
  type ComponentProps,
  isValidElement,
  type ReactElement,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/cn";

/** A chip that its owner has stopped rendering, kept until it has left, and where it stood. */
type Leaver = { element: ReactElement; index: number };

const keysOf = (elements: readonly ReactElement[]) => elements.map((element) => element.key);

/**
 * The children of the row, and with them those that were just taken out of it: a chip that its
 * owner removes is kept where it stood until it has left, so it can fade and its place can
 * close. The owner's list is already without it; only the picture lags.
 */
function usePresence(children: readonly ReactElement[], boxRef: RefObject<HTMLElement | null>) {
  const [before, setBefore] = useState(children);
  const [leavers, setLeavers] = useState<readonly Leaver[]>([]);

  // Compared while rendering, as React asks for state that follows a prop.
  if (keysOf(before).join("\n") !== keysOf(children).join("\n")) {
    const stays = new Set(keysOf(children));
    const gone = before
      .map((element, index) => ({ element, index }))
      .filter(({ element }) => !stays.has(element.key));
    // A chip that comes back while it is leaving is simply there again.
    setLeavers((old) => [...old.filter(({ element }) => !stays.has(element.key)), ...gone]);
    setBefore(children);
  }

  // A place says when its transition has ended (`left`). Where none runs at all, nothing would
  // ever say so: a frame after a chip was marked as leaving, whatever is not moving is dropped.
  // It is asked of the place and not timed, so a transition that is held is waited for.
  useEffect(() => {
    if (leavers.length === 0) return;
    const frame = requestAnimationFrame(() => {
      const moving = new Set<string | undefined>();
      boxRef.current
        ?.querySelectorAll<HTMLElement>('[data-slot="chip-place"][data-leaving]')
        .forEach((place) => {
          if (place.getAnimations().length > 0) moving.add(place.dataset.key);
        });
      setLeavers((old) => {
        const next = old.filter(({ element }) => moving.has(element.key ?? undefined));
        return next.length === old.length ? old : next;
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [leavers, boxRef]);

  const left = (key: string | null) =>
    setLeavers((old) => old.filter(({ element }) => element.key !== key));

  const places = children.map((element) => ({ element, leaving: false }));
  for (const { element, index } of leavers) {
    places.splice(Math.min(index, places.length), 0, { element, leaving: true });
  }
  return { places, left };
}

export type ChipGroupProps = ComponentProps<"div">;

/**
 * A row of chips that belong together: the filters on a list, the values chosen in a field. It
 * wraps onto further lines when the row is full. Name it (`aria-label`) with what the chips
 * are ("Filter").
 *
 * The row is what moves. A chip that joins it later opens its place, and the chip seats in; one
 * that is taken away fades, and the row closes its place. So the chips beside it glide instead
 * of jumping, and the owner's list can lose the chip at once: the row keeps it on screen until
 * it has left. The chips that are there when the row first shows do not move.
 *
 * Give each chip a `key` that stays its own.
 */
export function ChipGroup({ className, children, ...props }: ChipGroupProps) {
  // Page load does not animate: only a chip that mounts after the row stands comes in.
  const [live, setLive] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const box = useRef<HTMLDivElement>(null);
  const { places, left } = usePresence(Children.toArray(children).filter(isValidElement), box);
  return (
    <div
      ref={box}
      role="list"
      data-slot="chip-group"
      data-live={live ? "" : undefined}
      // The gap is a variable, because a chip that leaves has to take its gap with it.
      className={cn(
        "flex flex-wrap items-center gap-(--chip-gap) [--chip-gap:0.375rem]",
        className,
      )}
      {...props}
    >
      {places.map(({ element, leaving }) => (
        <span
          key={element.key}
          role="listitem"
          data-slot="chip-place"
          data-key={element.key ?? undefined}
          data-leaving={leaving ? "" : undefined}
          // What has left the owner's list can no longer be pressed or focused.
          inert={leaving}
          onTransitionEnd={(event) => {
            if (leaving && event.target === event.currentTarget) left(element.key);
          }}
          onTransitionCancel={(event) => {
            if (leaving && event.target === event.currentTarget) left(element.key);
          }}
          // A grid of one column that opens from nothing and closes to nothing. The chip inside
          // keeps its size all the while: only its place changes, which moves its neighbours.
          className={cn(
            "inline-grid grid-cols-[1fr] transition-[grid-template-columns,margin] spring-settle",
            "in-data-live:starting:-mr-(--chip-gap) in-data-live:starting:grid-cols-[0fr]",
            // The chip has faded before its place closes, so it is never seen under a neighbour.
            "data-leaving:-mr-(--chip-gap) data-leaving:grid-cols-[0fr] data-leaving:delay-75",
          )}
        >
          <span className="flex min-w-0 *:shrink-0">{element}</span>
        </span>
      ))}
    </div>
  );
}
