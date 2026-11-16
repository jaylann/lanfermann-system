/**
 * The outline of a seam as a `clip-path: polygon()`: the lower edge of the plate above, straight
 * across the page except in its middle, where a tongue dips into the part below (`down`) or a
 * notch rises into the plate above (`up`). The bends are rounded (a quadratic curve through each
 * corner, sampled), and the slopes keep their angle at every width.
 *
 * Kept out of the component so a Server Component can render a seam: no hooks, no measuring. The
 * width comes from CSS, not from here:
 *   --seam-w      half the narrow side of the tongue or notch, clamped to the window (`seam.tsx`)
 *   --seam-scale  1 from `sm` up; smaller on a phone, where the whole shape shrinks with it
 * The 50% in every x is the middle of the box the polygon clips.
 */

export type SeamDirection = "down" | "up";

/** The band above the edge, in px: it covers the last pixels of the part above, so they match. */
const BAND = 2;

/** At `--seam-scale: 1`: the edge steps 26px over a 35px run (about 37°), with bends of 24px. */
const DEPTH = 26;
const RUN = 35;
const BEND = 24;
/** Points per bend: enough that no facet shows at 3x. */
const STEPS = 8;

type Point = { x: number; y: number };
type Corner = {
  /** Which side of the middle the corner stands on, in units of `--seam-w`. */
  side: -1 | 1;
  /** Where the corner is, in px at scale 1, from `50% + side * --seam-w` and the band's foot. */
  at: Point;
  /** The direction the outline arrives in, and the one it leaves in. */
  from: Point;
  to: Point;
};

function unit(x: number, y: number): Point {
  const length = Math.hypot(x, y);
  return { x: x / length, y: y / length };
}

const left = unit(-1, 0);
const downLeft = unit(-RUN, DEPTH);
const upLeft = unit(-RUN, -DEPTH);

/**
 * Clockwise from the right end of the edge. The straight parts of the edge stand at `flat` (in px
 * below the band's foot), the middle at `middle`; the slopes join them at ±(--seam-w + RUN).
 */
const shapes: Record<SeamDirection, { flat: number; corners: Corner[] }> = {
  down: {
    flat: 0,
    corners: [
      { side: 1, at: { x: RUN, y: 0 }, from: left, to: downLeft },
      { side: 1, at: { x: 0, y: DEPTH }, from: downLeft, to: left },
      { side: -1, at: { x: 0, y: DEPTH }, from: left, to: upLeft },
      { side: -1, at: { x: -RUN, y: 0 }, from: upLeft, to: left },
    ],
  },
  up: {
    flat: DEPTH,
    corners: [
      { side: 1, at: { x: RUN, y: DEPTH }, from: left, to: upLeft },
      { side: 1, at: { x: 0, y: 0 }, from: upLeft, to: left },
      { side: -1, at: { x: 0, y: 0 }, from: left, to: downLeft },
      { side: -1, at: { x: -RUN, y: DEPTH }, from: downLeft, to: left },
    ],
  },
};

/** How far a bend reaches from its corner along each line. */
const reach = BEND * Math.tan(Math.atan2(DEPTH, RUN) / 2);

const px = (value: number) => `${Math.round(value * 100) / 100}px`;
const y = (value: number) => `calc(${px(BAND)} + ${px(value)} * var(--seam-scale))`;

function point(side: -1 | 1, x: number, at: number): string {
  const middle = side === 1 ? "50% + var(--seam-w)" : "50% - var(--seam-w)";
  return `calc(${middle} + ${px(x)} * var(--seam-scale)) ${y(at)}`;
}

function bend({ side, at, from, to }: Corner): string[] {
  const points: string[] = [];
  for (let step = 0; step <= STEPS; step += 1) {
    const s = step / STEPS;
    // A quadratic curve from `reach` before the corner to `reach` after it, pulled by the corner.
    const before = (1 - s) ** 2 * reach;
    const after = s ** 2 * reach;
    points.push(
      point(side, at.x - from.x * before + to.x * after, at.y - from.y * before + to.y * after),
    );
  }
  return points;
}

function outline({ flat, corners }: { flat: number; corners: Corner[] }): string {
  // The top runs above the box: an edge exactly on the box's top is smoothed, and the row of
  // pixels it leaves half open showed what lies under the plate.
  const top = `-${px(BAND)}`;
  return `polygon(${[`0 ${top}`, `100% ${top}`, `100% ${y(flat)}`, ...corners.flatMap(bend), `0 ${y(flat)}`].join(", ")})`;
}

/** The polygon per direction (the width and the scale are CSS variables, so one string each). */
export const seamOutline: Record<SeamDirection, string> = {
  down: outline(shapes.down),
  up: outline(shapes.up),
};

/**
 * Where the strip that holds the outline starts, measured from the seam (the top of the part
 * below): so high that the straight parts of the edge land on the seam itself.
 */
export const seamLift: Record<SeamDirection, string> = {
  down: `${-BAND}px`,
  up: `calc(${-BAND}px - ${DEPTH}px * var(--seam-scale))`,
};

/**
 * Half the tongue's narrow side as the outline reads it: the width asked for (`--seam-half`), but
 * never so wide that a slope leaves the window or reaches into the page's gutter.
 */
export const seamHalfWidth = `min(var(--seam-half), 50% - ${RUN}px * var(--seam-scale) - var(--seam-gutter))`;
