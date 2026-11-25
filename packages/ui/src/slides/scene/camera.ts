/**
 * The camera of a `Scene`: where the world stands in the scene's box, as numbers only. No React
 * and no DOM.
 *
 * A camera is a translation in px and a scale: a point `(wx, wy)` of the world is drawn at
 * `(x + wx * scale, y + wy * scale)` in the box. `Scene` writes it as
 * `transform: translate(x, y) scale(scale)` on the one layer that carries the world, with the
 * origin at that layer's top left corner.
 */

/** A rectangle: top left corner and size, in world units or in px. */
export type Rect = { x: number; y: number; w: number; h: number };

/** The size of the scene's box in px. */
export type Size = { w: number; h: number };

export type Camera = { x: number; y: number; scale: number };

/** Where a view stands in the box when it leaves room across: at the left, in the middle, at the right. */
export type CameraAlign = "start" | "center" | "end";

/** Room left free inside the box, in px. */
export type Insets = { top: number; right: number; bottom: number; left: number };

/**
 * A world unit is never drawn larger than a px: at scale 1 a node is as large as it was written,
 * and its 24px text is the kit's smallest size. Closer would only blur what is already legible.
 */
export const MAX_SCALE = 1;

/**
 * Below this scale a node is too small for its 24px text, which stays 24px on screen: the text
 * goes and the node is drawn as a filled block (the reference shows text from 0.7, at under
 * 24px; the kit allows nothing smaller, so its threshold sits where the default node still holds
 * two lines of 24px).
 */
export const NEAR_SCALE = 0.75;

/**
 * The room the camera leaves above a view: a group's label stands above its frame, 24px text on
 * a line of 1.3 and 8px under it, so a frame at the top of the view keeps its label in the box.
 */
export const VIEW_INSETS: Insets = { top: 48, right: 0, bottom: 0, left: 0 };

/** How long the camera takes from one view to the next, in ms (the reference's `fly(to, 900)`). */
export const TRAVEL_MS = 900;

export type FitOptions = {
  /** Room left free inside the box; `VIEW_INSETS` by default. */
  insets?: Insets;
  /** Where the view stands across when its height decides the scale; `start` by default. */
  align?: CameraAlign;
  /** `MAX_SCALE` by default. */
  maxScale?: number;
};

/**
 * The camera that shows `view` (a rectangle of the world) as large as the box allows, never
 * larger than `maxScale`. The view's top edge stands on the box's top inset: like a title, a
 * picture starts top left, and the room it leaves is below it and, with `align: "start"`, to its
 * right. `center` and `end` move it across.
 *
 * A view without width or height (one point, a line) is shown at `maxScale`.
 */
export function fitView(view: Rect, box: Size, options: FitOptions = {}): Camera {
  const insets = options.insets ?? VIEW_INSETS;
  const maxScale = options.maxScale ?? MAX_SCALE;
  const align = options.align ?? "start";
  const roomW = Math.max(0, box.w - insets.left - insets.right);
  const roomH = Math.max(0, box.h - insets.top - insets.bottom);
  const byWidth = view.w > 0 ? roomW / view.w : maxScale;
  const byHeight = view.h > 0 ? roomH / view.h : maxScale;
  const scale = Math.min(byWidth, byHeight, maxScale);
  const drawnW = view.w * scale;
  const left = insets.left + alignOffset(align, roomW - drawnW);
  return { x: left - view.x * scale, y: insets.top - view.y * scale, scale };
}

function alignOffset(align: CameraAlign, room: number): number {
  switch (align) {
    case "start":
      return 0;
    case "center":
      return room / 2;
    case "end":
      return room;
    default: {
      const never: never = align;
      return never;
    }
  }
}

/** Where a rectangle of the world is drawn in the box. */
export function screenRect(rect: Rect, camera: Camera): Rect {
  return {
    x: camera.x + rect.x * camera.scale,
    y: camera.y + rect.y * camera.scale,
    w: rect.w * camera.scale,
    h: rect.h * camera.scale,
  };
}

/**
 * Whether a rectangle of the world is drawn wholly inside the box, give or take `tolerance` px.
 * `top` asks for that much more room above it (a group's label).
 */
export function insideBox(rect: Rect, camera: Camera, box: Size, tolerance = 1, top = 0): boolean {
  const drawn = screenRect(rect, camera);
  return (
    drawn.x >= -tolerance &&
    drawn.y - top >= -tolerance &&
    drawn.x + drawn.w <= box.w + tolerance &&
    drawn.y + drawn.h <= box.h + tolerance
  );
}

/** Whether a node's text is shown at this scale. */
export function isNear(scale: number): boolean {
  return scale >= NEAR_SCALE - 1e-9;
}

/**
 * The reference's travel curve: slow out, fast through the middle, slow in (the cubic in-out
 * ease, close to `cubic-bezier(0.65, 0, 0.35, 1)`). `t` is clamped to 0 to 1.
 */
export function easeInOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2;
}

/**
 * The camera on its way from `from` to `to`, `t` of the way in time (0 to 1, eased here). As in
 * the reference, the scale moves evenly in its logarithm, so zooming in by four takes as long as
 * zooming in by two twice, and the world point in the box's middle moves in a straight line.
 * Moving the translation and the scale each on their own would swing the picture sideways.
 */
export function cameraAt(from: Camera, to: Camera, box: Size, t: number): Camera {
  const e = easeInOutCubic(t);
  if (e <= 0) return from;
  if (e >= 1) return to;
  const scale = Math.exp(Math.log(from.scale) + (Math.log(to.scale) - Math.log(from.scale)) * e);
  const midX = box.w / 2;
  const midY = box.h / 2;
  // The world point under the box's middle, at either end.
  const fromX = (midX - from.x) / from.scale;
  const fromY = (midY - from.y) / from.scale;
  const toX = (midX - to.x) / to.scale;
  const toY = (midY - to.y) / to.scale;
  const worldX = fromX + (toX - fromX) * e;
  const worldY = fromY + (toY - fromY) * e;
  return { x: midX - worldX * scale, y: midY - worldY * scale, scale };
}

/** Two cameras that draw the same picture, to a hundredth of a px. */
export function sameCamera(a: Camera, b: Camera): boolean {
  return (
    Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01 && Math.abs(a.scale - b.scale) < 1e-6
  );
}

/** The camera as the CSS `transform` of the world's layer. */
export function cameraTransform(camera: Camera): string {
  const round = (value: number, places: number) => Number(value.toFixed(places));
  return `translate(${round(camera.x, 2)}px, ${round(camera.y, 2)}px) scale(${round(camera.scale, 5)})`;
}
