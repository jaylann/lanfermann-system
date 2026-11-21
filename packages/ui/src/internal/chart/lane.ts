import type { CSSProperties } from "react";

/**
 * A lane: a layer as large as the plot, moved by `translate` so that its bottom right corner
 * stands where a mark belongs. What it carries is placed at that corner (`absolute right-0
 * bottom-0`). A `translate` in percent is a share of the lane, so of the plot: the place is
 * right at every width without measuring, the server draws it, and moving it is a transform
 * the compositor runs (DESIGN.md: "A place is a share, not a length").
 *
 * The corner is the bottom right one so a lane only ever reaches past the plot upwards and to
 * the left: overflow there never adds to the room a scrolling page has.
 */
export const lane = "pointer-events-none absolute inset-0";

/**
 * The `translate` of a lane whose corner stands at `x` (0 at the left, 1 at the right) and
 * `up` (0 at the bottom, 1 at the top). Leave one out to keep that axis still.
 */
export function laneAt(x?: number, up?: number): CSSProperties {
  const across = x === undefined ? "0%" : `${round((x - 1) * 100)}%`;
  const along = up === undefined ? "0%" : `${round(-up * 100)}%`;
  return { translate: `${across} ${along}` };
}

/**
 * The `translate` of a label that hangs from its mark at `x` and stays inside the plot: at the
 * left edge it starts at its mark, at the right edge it ends there, and in between it slides
 * along itself by the same share. Set on the label, which stands at its lane's corner.
 */
export function labelAlong(x: number): CSSProperties {
  return { translate: `${round((1 - x) * 100)}% 0` };
}

const round = (value: number) => Math.round(value * 1000) / 1000;
