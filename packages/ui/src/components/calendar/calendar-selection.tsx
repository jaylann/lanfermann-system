"use client";

import { type CSSProperties, type RefObject, useLayoutEffect, useRef, useState } from "react";

import { toIsoDate } from "@/internal/iso-date";
import {
  gridDays,
  type GridSizes,
  pixelPoints,
  polygonPoints,
  rangeInGrid,
  rangeOutline,
  type Span,
  spanOutline,
} from "@/internal/range-shape";
import { cn } from "@/lib/cn";
import { atRest, type Moving, springForce, stepSpring } from "@/motion/spring-step";
import { springs } from "@/motion/springs";

/** The room the drawing keeps around the grid, in px: for its edge, and a swing past the grid. */
const ROOM = 4;

/** The shape as the three custom properties the stylesheet draws it from. */
type Drawing = { shape: string; edge: string; start: string };

/** The shape at rest, in the calendar's own units: nothing measured, right on a server too. */
function atRestDrawing({ top, first, bottom, last }: Span): Drawing {
  const rows = bottom - top + 1;
  const outline = rangeOutline(first, last, rows, 0, top);
  return {
    shape: polygonPoints(outline, ROOM),
    edge: polygonPoints(rangeOutline(first, last, rows, 1, top), ROOM),
    start: polygonPoints(outline.slice(0, 1), ROOM),
  };
}

/** The shape on its way, in pixels. */
function movingDrawing(span: Span, sizes: GridSizes): Drawing {
  const outline = spanOutline(span, sizes);
  return {
    shape: pixelPoints(outline, ROOM),
    edge: pixelPoints(spanOutline(span, sizes, 1), ROOM),
    start: pixelPoints(outline.slice(0, 1), ROOM),
  };
}

function draw(element: HTMLElement, drawing: Drawing) {
  element.style.setProperty("--shape", drawing.shape);
  element.style.setProperty("--shape-edge", drawing.edge);
  element.style.setProperty("--shape-start", drawing.start);
}

/** The sizes of the grid as it stands, read once when a motion begins. */
function measure(element: HTMLElement): GridSizes | undefined {
  const day = element.parentElement?.querySelector<HTMLElement>('[data-slot="calendar-day"]');
  if (!day) return undefined;
  const cell = day.offsetWidth;
  // Seven days and six gaps make the grid; the drawing is that and its room on both sides.
  const gap = (element.offsetWidth - 2 * ROOM - 7 * cell) / 6;
  return { cell, gap, radius: Number.parseFloat(getComputedStyle(day).borderTopLeftRadius) || 0 };
}

const force = springForce(springs.seat);
const KEYS = ["top", "first", "bottom", "last"] as const;

/**
 * Moves the shape from where it is to a new selection; returns the ref for the shape. The four numbers of the selection each
 * ride the `seat` spring, and the outline is drawn from them frame by frame (`spanOutline`),
 * so it is a proper shape at every instant and takes a new target mid-flight. Only the drawing's
 * custom properties are written: no layout, no React render. When it has arrived, the shape at
 * rest is written back in the calendar's own units.
 *
 * What it does not do: move on the first drawing (a page that loads does not animate), or under
 * reduced motion. A selection made where there was none seats instead: it grows out of its day.
 */
function useGlide(span: Span | undefined): RefObject<HTMLSpanElement | null> {
  const element = useRef<HTMLSpanElement>(null);
  const moving = useRef<Record<(typeof KEYS)[number], Moving>>(undefined);
  const drawn = useRef(false);
  const top = span?.top;
  const first = span?.first;
  const bottom = span?.bottom;
  const last = span?.last;

  useLayoutEffect(() => {
    const node = element.current;
    const had = moving.current;
    const before = drawn.current;
    drawn.current = true;
    if (!node) return;
    if (top === undefined || first === undefined || bottom === undefined || last === undefined) {
      moving.current = undefined;
      return;
    }
    const target: Span = { top, first, bottom, last };
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sizes = had && !still ? measure(node) : undefined;

    if (!had || !sizes) {
      moving.current = {
        top: { value: top, velocity: 0 },
        first: { value: first, velocity: 0 },
        bottom: { value: bottom, velocity: 0 },
        last: { value: last, velocity: 0 },
      };
      draw(node, atRestDrawing(target));
      if (before && !had && !still) {
        // Chosen where nothing was: it seats. The transition is the stylesheet's.
        node.style.transition = "none";
        node.style.scale = "0.6";
        node.style.opacity = "0";
        void node.offsetWidth;
        node.style.transition = "";
        node.style.scale = "";
        node.style.opacity = "";
      }
      return;
    }

    let frame = 0;
    let then = performance.now();
    const tick = (now: number) => {
      const seconds = (now - then) / 1000;
      then = now;
      let arrived = true;
      for (const key of KEYS) {
        had[key] = stepSpring(had[key], target[key], force, seconds);
        arrived &&= atRest(had[key], target[key]);
      }
      if (arrived) {
        for (const key of KEYS) had[key] = { value: target[key], velocity: 0 };
        draw(node, atRestDrawing(target));
        return;
      }
      draw(
        node,
        movingDrawing(
          {
            top: had.top.value,
            first: had.first.value,
            bottom: had.bottom.value,
            last: had.last.value,
          },
          sizes,
        ),
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [top, first, bottom, last]);
  return element;
}

/** Today's ring where the day stands on the selection: inside, in the colour that reads there. */
const ringOnSelection =
  "after:pointer-events-none after:absolute after:inset-[3px] after:rounded-[calc(var(--radius-md)-3px)] after:inset-ring-[1.5px] after:inset-ring-on-accent/60";

/**
 * What is chosen, drawn as one raised Indigo shape over the days (`calendar-selection`): one
 * day, or a range from its first day to its last, filled through and with one edge, also where
 * it runs on into the next week.
 *
 * It is one element per month. When the selection changes it is not swapped for another: it
 * glides to its new place and re-forms on the way (`useGlide`). A range grows out of its first
 * day, a new week out of the edge, two weeks join through a neck or let go of each other. The
 * mark travels, here as everywhere.
 *
 * The shape carries the numbers of the days in the colour that reads on it, cut to its outline
 * like the fill. So a number changes colour exactly where the edge passes over it, and never
 * stands in the wrong colour while the shape is still on its way.
 */
export function CalendarSelection({
  month,
  chosen,
  today,
}: {
  /** The month the grid shows. */
  month: Date;
  /** What is chosen, as a range of days; one day is a range of itself. */
  chosen: { from: Date; to: Date } | undefined;
  /** The day that counts as today, as an ISO date. */
  today: string;
}) {
  const place = chosen ? rangeInGrid(month, chosen.from, chosen.to) : undefined;
  const span = place && { ...place, bottom: place.top + place.rows - 1 };
  const element = useGlide(span);

  // What React draws is the first shape only; from then on the motion owns the drawing, and a
  // style that never changes is never written again.
  const [initial] = useState(() => span && atRestDrawing(span));
  return (
    <span
      ref={element}
      aria-hidden
      data-slot="calendar-selection"
      data-empty={span ? undefined : ""}
      className="calendar-selection z-[1] depth-tone-accent"
      style={
        {
          "--room": `${ROOM}px`,
          ...(initial && {
            "--shape": initial.shape,
            "--shape-edge": initial.edge,
            "--shape-start": initial.start,
          }),
          // Where it grows from when it seats: the middle of its first day.
          ...(span && {
            transformOrigin: `calc(${span.first + 0.5} * var(--u) + ${ROOM}px) calc(${span.top + 0.5} * var(--u) + ${ROOM}px)`,
          }),
        } as CSSProperties
      }
    >
      <span data-layer="edge" />
      <span data-layer="face">
        <span className="absolute top-(--room) left-(--room) grid grid-cols-[repeat(7,var(--calendar-cell))] gap-(--calendar-gap) text-control text-on-accent select-none forced-colors:text-[HighlightText]">
          {gridDays(month).map((date) => {
            const iso = toIsoDate(date);
            return (
              <span
                key={iso}
                className={cn(
                  "relative flex size-(--calendar-cell) items-center justify-center",
                  date.getMonth() !== month.getMonth() && "opacity-70",
                  iso === today && ["font-semibold", ringOnSelection],
                )}
              >
                {date.getDate()}
              </span>
            );
          })}
        </span>
      </span>
      <span data-layer="light" />
      <span data-layer="shade" />
    </span>
  );
}
