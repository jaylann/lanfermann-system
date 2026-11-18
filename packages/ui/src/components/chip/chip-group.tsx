"use client";

import { Children, type ComponentProps, isValidElement, type ReactElement, useRef } from "react";

import { placeInRow, placeProps, useLive, usePresence } from "@/internal/presence";
import { cn } from "@/lib/cn";

const keyOf = (element: ReactElement) => element.key ?? "";

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
  const live = useLive();
  const box = useRef<HTMLDivElement>(null);
  const { places, left } = usePresence(
    Children.toArray(children).filter(isValidElement),
    keyOf,
    box,
  );
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
      {places.map((place) => (
        <span
          key={place.key}
          role="listitem"
          data-slot="chip-place"
          {...placeProps(place, left)}
          className={placeInRow}
        >
          <span className="flex min-w-0 *:shrink-0">{place.item}</span>
        </span>
      ))}
    </div>
  );
}
