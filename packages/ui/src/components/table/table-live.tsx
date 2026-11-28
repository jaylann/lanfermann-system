"use client";

import {
  Children,
  cloneElement,
  type ComponentProps,
  isValidElement,
  type ReactElement,
  type TransitionEvent,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Glide,
  GlideFrame,
  glidePlace,
  onFaded,
  placesChange,
  useLeaveWhenFaded,
} from "@/internal/glide";
import { placeProps, useLive, usePresence } from "@/internal/presence";
import { cn } from "@/lib/cn";

type Row = ReactElement<Record<string, unknown>>;

const isRow = (child: unknown): child is Row => isValidElement<Record<string, unknown>>(child);
const keyOf = (row: Row) => String(row.key ?? "");

type Ended = (event: TransitionEvent<HTMLElement>) => void;

/** The row's own handler, then the body's: a row may listen to its transitions as well. */
function withOwn(theirs: unknown, ours: Ended): Ended {
  if (typeof theirs !== "function") return ours;
  return (event) => {
    (theirs as Ended)(event);
    ours(event);
  };
}

/**
 * The body of a table whose rows come and go while it is read (`TableBody live`): a file
 * browser's list, a queue. What is there on load stands still; a row that joins fades in at its
 * place and the rows below glide down to make room; one that is taken away fades, and the rows
 * below glide up into its place, as the tiles of a `FileGrid` do. Each row needs a `key` that
 * stays its own.
 */
export function LiveTableBody({ className, children, ref, ...props }: ComponentProps<"tbody">) {
  const box = useRef<HTMLTableSectionElement>(null);
  // The caller's ref is filled from the body's own, which stays one object: the glide reads it
  // while React writes a change (`GlideFrame`), when a ref that was merged anew is still empty.
  useImperativeHandle(ref, () => box.current!, []);
  const live = useLive();
  const [glide] = useState(() => new Glide(box));
  // One array for as long as the children are the same (`usePresence`).
  const rows = useMemo(() => Children.toArray(children).filter(isRow), [children]);
  const { places, left } = usePresence(rows, keyOf, box);
  useLeaveWhenFaded(places, left);
  return (
    <tbody
      ref={box}
      data-slot="table-body"
      data-live={live ? "" : undefined}
      role="rowgroup"
      className={className}
      {...props}
    >
      {places.map((place) => {
        const own = placeProps(place, left);
        const row = place.item.props;
        const rowClass = row.className;
        // A row is its own place: a table row cannot be wrapped.
        return cloneElement(place.item, {
          key: place.key,
          "data-glide": place.key,
          "data-joining": place.joining ? "" : undefined,
          ...own,
          onTransitionEnd: withOwn(row.onTransitionEnd, onFaded(own.onTransitionEnd)),
          onTransitionCancel: withOwn(row.onTransitionCancel, onFaded(own.onTransitionCancel)),
          className: cn(typeof rowClass === "string" ? rowClass : undefined, glidePlace),
        });
      })}
      <GlideFrame glide={glide} change={placesChange(places)} />
    </tbody>
  );
}
