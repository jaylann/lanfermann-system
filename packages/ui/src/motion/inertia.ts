/**
 * Inertia for a part that is dragged: a slider's thumb, the thumb of a segmented control. Pulled
 * fast, its trailing side lags and the part stretches along its way; when it stops, it swings
 * back past its shape (the squash) and settles. Slow, careful moves barely show; a flick does.
 *
 * This module only decides HOW MUCH the part is stretched, each time it has moved. The drawing
 * is CSS: a `scale` that transitions to the new amount, and back to rest on `spring-rebound`,
 * whose overshoot is the squash. So the deformation runs on the compositor at the screen's full
 * rate, and nothing here runs per frame or measures the page.
 *
 * Pure data and functions: no "use client", safe to test without a browser.
 */

/** How much a part gives to its speed: `gain` px longer per px/s, `max` px at the most. */
export type Give = { gain: number; max: number };

/** A slider's thumb, 14px across: a flick of 500px/s adds 6px to it. */
const THUMB_GIVE: Give = { gain: 0.012, max: 6 };

/**
 * A pill (the thumb of a segmented control) is five to eight times as long. Stretched by the
 * same 6px it would look rigid, so it gives by a share of its length instead: 15% at a normal
 * pull of 400px/s, a fifth at the most.
 */
const PILL_GAIN = 0.000375;
const PILL_MAX = 0.2;

/** How a pill `size` px long gives. */
export function pillGive(size: number): Give {
  return { gain: size * PILL_GAIN, max: size * PILL_MAX };
}

/** Below this speed, in px/s, the part counts as standing. */
const MIN_SPEED = 20;
/**
 * A move that comes later than this after the last one starts from rest: whatever speed the
 * part had has gone by then.
 */
const STALE_MS = 120;

/** After this long without a move the part is let go and rebounds. */
export const INERTIA_RELEASE_MS = 90;

export type Motion = {
  /** Where the part stood at the last move, in px. */
  x: number;
  /** When that was, in ms. */
  time: number;
  /** How fast it travels, in px/s, smoothed over the last moves. */
  speed: number;
  /** The way it travels: 1 towards larger x, -1 towards smaller. */
  direction: 1 | -1;
  /** How long it is, as a factor of its length at rest: 1 at rest, 1.43 at the most (14px). */
  stretch: number;
};

export function restingMotion(x: number, time: number): Motion {
  return { x, time, speed: 0, direction: 1, stretch: 1 };
}

/**
 * The part has moved: it now stands at `x` (px) at `time` (ms). `size` is its length at rest,
 * in px; `give` is how it deforms (a slider's thumb unless said otherwise). Returns how it should
 * look from now on.
 */
export function trackMotion(
  previous: Motion,
  x: number,
  time: number,
  size: number,
  give: Give = THUMB_GIVE,
): Motion {
  const elapsed = time - previous.time;
  const distance = x - previous.x;
  if (elapsed <= 0 || distance === 0 || size <= 0) return { ...previous, x };

  const measured = (Math.abs(distance) / elapsed) * 1000;
  // Moves arrive in steps (a value has a `step`), so one move alone says little: average it
  // with what came before, unless that is too long ago to count.
  const speed = elapsed > STALE_MS ? measured : (previous.speed + measured) / 2;
  const longer = speed < MIN_SPEED ? 0 : Math.min(speed * give.gain, give.max);
  return {
    x,
    time,
    speed,
    direction: distance > 0 ? 1 : -1,
    stretch: 1 + longer / size,
  };
}

/**
 * A part in a trough cannot lag through its wall: `room` is the free way behind it, in px, and
 * the stretch is cut to what fits there. Pulled off a wall it starts rigid and gives as it
 * leaves.
 */
export function withinRoom(stretch: number, room: number, size: number): number {
  if (size <= 0) return 1;
  return Math.min(stretch, 1 + Math.max(0, room) / size);
}

/*
 * A part moved by a spring rather than a finger: a segment thumb travelling to the chosen
 * segment. It has no measured speed, so the stretch follows the distance it has to cover,
 * decided once when it sets off: its leading edge is on its way at once and the tail comes
 * after. It is let go at `TRAVEL_RELEASE_MS`, so the rebound's swing (the squash) lands with it.
 */

/** px longer per px of travel: 100px of way stretch a thumb by 15px. */
const TRAVEL_GAIN = 0.18;
/** The most a travelling part stretches, as a share of its length. */
const TRAVEL_MAX = 0.3;

/** When a travelling part is let go to rebound, in ms after it set off. */
export const TRAVEL_RELEASE_MS = 120;

/** How long a trip takes to look finished, in ms: until then the part does not lean. */
export const TRAVEL_BUSY_MS = 320;

/** How long a part `size` px long gets for a trip of `distance` px: 1 at rest. */
export function travelStretch(distance: number, size: number): number {
  if (size <= 0 || distance === 0) return 1;
  const longer = Math.min(Math.abs(distance) * TRAVEL_GAIN, size * TRAVEL_MAX);
  return 1 + longer / size;
}

/*
 * Anticipation: a resting thumb leans towards a pointer that rests over another segment, a few
 * pixels, more the further away the pointer is. Over the thumb itself it stands still. It does
 * not only shift: its near edge goes further than its far edge, so it reaches for the pointer.
 */

/** The least and the most a thumb leans, in px, and how much more per px of distance. */
const LEAN_MIN = 2;
const LEAN_MAX = 5;
const LEAN_GAIN = 0.02;

/**
 * How far to lean, in px, signed: `offset` is how far the pointer is beyond the thumb's nearer
 * edge, negative to its left. 0 when the pointer is over the thumb.
 */
export function leanToward(offset: number): number {
  if (offset === 0) return 0;
  return Math.sign(offset) * Math.min(LEAN_MIN + Math.abs(offset) * LEAN_GAIN, LEAN_MAX);
}

/** Of the way its near edge leans, the far edge follows this share. The rest is reach. */
const LEAN_FOLLOW = 0.5;

export type Lean = {
  /** How far the whole part shifts, in px, signed. */
  shift: number;
  /** How long it gets, as a factor of its length at rest. */
  stretch: number;
  /** The edge that only shifts, while the other reaches: 1 its right edge, -1 its left. */
  hold: 1 | -1;
};

/**
 * The shape of a lean for a part `size` px long: `offset` as for `leanToward`. `room` is the free
 * way on the pointer's side, in px: a thumb that stands at the wall does not lean into it.
 */
export function leanShape(offset: number, size: number, room = Number.POSITIVE_INFINITY): Lean {
  const reach = Math.min(Math.abs(leanToward(offset)), Math.max(0, room));
  if (reach === 0 || size <= 0) return { shift: 0, stretch: 1, hold: 1 };
  const side = offset > 0 ? 1 : -1;
  const shift = reach * LEAN_FOLLOW;
  return { shift: side * shift, stretch: 1 + (reach - shift) / size, hold: side > 0 ? -1 : 1 };
}
