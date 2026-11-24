import type { CSSProperties } from "react";

import type { SlideGround } from "@/slides/slide/slide";

export type MarkerProps = {
  /** The number. It appears twice on the slide: once on the evidence, once beside the finding. */
  n: number;
  /** Colour set to draw from when the disc sits on a frame rather than on the slide's ground. */
  ground?: SlideGround;
  /** A pinned position inside a frame: `position: absolute`, `left`, `top`. */
  style?: CSSProperties;
};

/**
 * The numbered disc of the proof apparatus.
 *
 * A number on a slide always points at something: marker 2 on the screenshot is finding 2 in the
 * list. Markers are the only filled accent shape in the kit. Nine at most on one slide; three is
 * typical. Do not use a marker as a bullet, a step counter or decoration.
 */
export function Marker({ n, ground, style }: MarkerProps) {
  return (
    <p
      data-slot="slide-marker"
      // A ground of its own resolves the accent and the numeral's colour anew, for this disc only.
      data-slide-ground={ground}
      className="size-12 rounded-full bg-accent text-center text-slide-meta leading-12 font-semibold text-on-accent tabular-nums"
      style={style}
    >
      {n}
    </p>
  );
}
