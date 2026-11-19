/**
 * The cut-out that parts two avatars: the gap between them is not a ring in the colour of the
 * ground, it is cut out of the avatar underneath, so it is right on every ground, on a washed
 * table row and over a picture. The cut follows the rounded corners of the avatar in front at a
 * constant distance: the outline of a rounded square grown by the gap is a rounded square whose
 * corner radius is the radius plus the gap.
 *
 * Each cut is one SVG for the avatar's own box, used as its mask: it moves and scales with the
 * avatar and is drawn in whole pixels. A presence dot is cut out the same way, in a circle the
 * gap larger than the dot. Server-safe; the numbers are pixels at a root size of 16px.
 */

export type AvatarSize = "sm" | "md" | "lg" | "xl";

/**
 * The avatar of each size: its side, its corner radius (`rounded-xs` to `rounded-lg`, from
 * `radius.css`, which a test compares) and the diameter of its presence dot.
 */
export const avatarGeometry: Record<AvatarSize, { size: number; radius: number; dot: number }> = {
  sm: { size: 24, radius: 5, dot: 6 },
  md: { size: 28, radius: 6, dot: 8 },
  lg: { size: 36, radius: 8, dot: 10 },
  xl: { size: 48, radius: 10, dot: 12 },
};

/**
 * How far one avatar lies over the next, in pixels: about a quarter of it (`loose`) or a third
 * (`tight`). The loose overlap is a little more than a quarter at the large sizes, where less
 * would let a corner of the avatar underneath poke out beside the cut (see `cleanCut`).
 */
export const avatarOverlap: Record<"loose" | "tight", Record<AvatarSize, number>> = {
  loose: { sm: 6, md: 7, lg: 10, xl: 14 },
  tight: { sm: 8, md: 9, lg: 12, xl: 16 },
};

export type CutOptions = {
  /** The avatar's side. */
  size: number;
  /** Its corner radius, the same for the avatar in front. */
  radius: number;
  /** The width of the gap. */
  gap: number;
  /** From the left edge of the avatar in front to this one's: size minus overlap. None: in front. */
  step?: number;
  /** The diameter of a presence dot in the bottom corner on the end side. */
  dot?: number;
  /** Right to left: the avatar in front stands on the right, the dot in the bottom-left corner. */
  rtl?: boolean;
};

/**
 * Whether the cut leaves the avatar underneath a clean edge. The corner of the cut and the
 * avatar's own top-left corner are two arcs side by side; where the overlap is small against the
 * radius, the avatar's own arc reaches out of the cut's and its corner shows as a thin horn.
 * It does not when its topmost point lies within the cut's arc.
 */
export function cleanCut(radius: number, overlap: number, gap: number): boolean {
  const apart = 2 * radius - overlap;
  return apart <= 0 || apart * apart <= 2 * radius * gap + gap * gap;
}

/** The shapes cut out of an avatar, in its own pixels. */
export function cutShapes({ size, radius, gap, step, dot, rtl }: CutOptions) {
  const holes: string[] = [];
  let rect: { x: number; y: number; width: number; height: number; rx: number } | undefined;
  if (step !== undefined) {
    // The avatar in front, grown by the gap on every side.
    rect = {
      x: rtl ? step - gap : -step - gap,
      y: -gap,
      width: size + 2 * gap,
      height: size + 2 * gap,
      rx: radius + gap,
    };
    holes.push(
      `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${rect.rx}"/>`,
    );
  }
  let circle: { cx: number; cy: number; r: number } | undefined;
  if (dot !== undefined) {
    circle = { cx: rtl ? dot / 2 : size - dot / 2, cy: size - dot / 2, r: dot / 2 + gap };
    holes.push(`<circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}"/>`);
  }
  return { rect, circle, holes };
}

const masks = new Map<string, string>();

/**
 * The mask of one avatar as a CSS `url()`, or `undefined` when nothing is cut out of it. Black
 * shapes in an SVG `<mask>` rather than holes in one path, so two cuts that overlap stay cut.
 */
export function cutMask(options: CutOptions): string | undefined {
  const key = JSON.stringify(options);
  const cached = masks.get(key);
  if (cached) return cached;
  const { holes } = cutShapes(options);
  if (holes.length === 0) return undefined;
  const { size } = options;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<mask id="m"><rect width="${size}" height="${size}" fill="#fff"/><g fill="#000">${holes.join("")}</g></mask>` +
    `<rect width="${size}" height="${size}" mask="url(#m)"/></svg>`;
  const mask = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  masks.set(key, mask);
  return mask;
}
