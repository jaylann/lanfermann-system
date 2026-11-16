import type React from "react";

/**
 * A trough that takes a fill: the track of a `Progress`, a `Meter` and a `Slider`.
 *
 * The fill is a child of the trough, so it would cover the trough's shaded edge and lie on top
 * like a sticker. The shade is therefore drawn by `::after`, over the fill: the colour lies IN
 * the trough, as it does in a switch that is on.
 */
export const troughTrack = [
  "overflow-hidden rounded-full bg-trough",
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:depth-trough",
].join(" ");

/**
 * The fill. Its colour is the part's own; in forced colours it is the system's highlight.
 *
 * It is a bar as long as the trough, pushed out of it at the start so that only its end shows
 * (`fillStyle`). It moves by `translate`, which the compositor animates; a width would be laid
 * out again on every frame.
 */
export const troughFill =
  "h-full rounded-full translate-x-[calc((var(--fill,1)-1)*100%)] rtl:translate-x-[calc((1-var(--fill,1))*100%)] forced-colors:bg-[Highlight]";

/** How much of the trough is filled, from 0 to 1. */
export function fillFraction(value: number, min = 0, max = 100) {
  return max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
}

/**
 * The style of a fill that stands at `fraction`. The width overrides the one Base UI sets from
 * the value: here the place says it, not the length.
 */
export function fillStyle(fraction: number) {
  return { width: "100%", "--fill": fraction } as React.CSSProperties;
}

/**
 * The layout of a labelled gauge (`Progress`, `Meter`, `Slider`): the name at the start, the
 * value at the end of the same line, the track under both.
 */
export const gaugeRoot = "grid w-full grid-cols-[1fr_auto] items-baseline gap-x-4";
export const gaugeLabel = "text-control font-medium text-fg";
export const gaugeValue = "text-control text-fg-muted tabular-nums";
