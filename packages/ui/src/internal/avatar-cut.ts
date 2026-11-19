/**
 * The cut-out that parts two avatars: the gap between them is not a ring in the colour of the
 * ground, it is cut out of the avatar underneath, so it is right on every ground, on a washed
 * table row and over a picture. Avatars are round, and the outline of a circle grown by the gap
 * is a circle the gap larger: the cut follows the avatar in front at a constant distance, and
 * what is seen of the one underneath is a clean crescent.
 *
 * A presence dot stands on the edge of its avatar, half outside it, and is cut out of the avatar
 * the same way, in a circle the gap larger than the dot; the avatar underneath has a hole for
 * the dot of the one in front as well, so the dot never touches it.
 *
 * Each cut is one SVG for the avatar's own box, used as its mask: it moves and scales with the
 * avatar and is drawn in whole pixels. Server-safe; the numbers are pixels at a 16px root.
 */

export type AvatarSize = "sm" | "md" | "lg" | "xl";

/** The avatar of each size: its diameter and the diameter of its presence dot. */
export const avatarGeometry: Record<AvatarSize, { size: number; dot: number }> = {
  sm: { size: 24, dot: 6 },
  md: { size: 28, dot: 8 },
  lg: { size: 36, dot: 10 },
  xl: { size: 48, dot: 12 },
};

/**
 * How far one avatar lies over the next, in pixels: a quarter of it, so a face stays a face
 * (Justin, 2026-11-19, over a third).
 */
export const avatarOverlap: Record<AvatarSize, number> = { sm: 6, md: 7, lg: 9, xl: 12 };

/**
 * The width of every cut, in pixels: between two avatars and around a presence dot. Fine enough
 * that a stack reads as one group (Justin, 2026-11-19, over 3px).
 */
export const AVATAR_GAP = 2;

export type CutOptions = {
  /** The avatar's diameter. */
  size: number;
  /** The width of the gap. */
  gap: number;
  /** From the avatar in front to this one: size minus overlap. None: this one is in front. */
  step?: number;
  /** The diameter of this avatar's presence dot. */
  dot?: number;
  /** The diameter of the presence dot of the avatar in front. */
  frontDot?: number;
  /** Right to left: the avatar in front stands on the right, the dots in the bottom-left. */
  rtl?: boolean;
};

type Circle = { cx: number; cy: number; r: number };

/** Where a presence dot stands in an avatar's box: on its edge, in the bottom end corner. */
export function dotCentre(size: number, dot: number): number {
  return size - dot / 2;
}

/** The circles cut out of an avatar, in its own pixels. */
export function cutShapes({ size, gap, step, dot, frontDot, rtl }: CutOptions): Circle[] {
  const circles: Circle[] = [];
  if (step !== undefined) {
    // The avatar in front, grown by the gap.
    circles.push({ cx: size / 2 - step, cy: size / 2, r: size / 2 + gap });
    if (frontDot !== undefined) {
      const at = dotCentre(size, frontDot);
      circles.push({ cx: at - step, cy: at, r: frontDot / 2 + gap });
    }
  }
  if (dot !== undefined) {
    const at = dotCentre(size, dot);
    circles.push({ cx: at, cy: at, r: dot / 2 + gap });
  }
  return rtl ? circles.map((circle) => ({ ...circle, cx: size - circle.cx })) : circles;
}

const masks = new Map<string, string>();

/**
 * The mask of one avatar as a CSS `url()`, or `undefined` when nothing is cut out of it. Black
 * circles in an SVG `<mask>` rather than holes in one path, so two cuts that overlap stay cut.
 */
export function cutMask(options: CutOptions): string | undefined {
  const key = JSON.stringify(options);
  const cached = masks.get(key);
  if (cached) return cached;
  const circles = cutShapes(options);
  if (circles.length === 0) return undefined;
  const { size } = options;
  const holes = circles
    .map((circle) => `<circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}"/>`)
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<mask id="m"><rect width="${size}" height="${size}" fill="#fff"/><g fill="#000">${holes}</g></mask>` +
    `<rect width="${size}" height="${size}" mask="url(#m)"/></svg>`;
  const mask = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  masks.set(key, mask);
  return mask;
}
