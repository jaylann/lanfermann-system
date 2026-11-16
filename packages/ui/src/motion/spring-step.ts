/**
 * A spring from the table, stepped by hand: for the few motions CSS cannot run, because what
 * moves is not one property but the numbers a shape is built from (the selection of a calendar).
 * Like a CSS spring it can be given a new target at any moment and carries its speed over.
 *
 * Pure functions: no "use client", safe to test without a browser.
 */
import type { springs } from "@/motion/springs";

type Spring = (typeof springs)[keyof typeof springs];

/** A value on its way: where it is and how fast it moves, per second. */
export type Moving = { value: number; velocity: number };

/** The longest step a frame may take, in s: a tab that was in the background does not leap. */
const LONGEST_FRAME = 1 / 30;
/** The spring is worked out in steps of this, in s, so it is the same at any frame rate. */
const SUBSTEP = 1 / 240;

/**
 * Stiffness and damping of a spring from the table, for a mass of one: the same reading of
 * `visualDuration` and `bounce` that Motion and the generated CSS use.
 */
export function springForce({ visualDuration, bounce }: Spring) {
  return {
    stiffness: ((2 * Math.PI) / visualDuration) ** 2,
    damping: (4 * Math.PI * (1 - bounce)) / visualDuration,
  };
}

/** Moves a value towards its target for `seconds`. */
export function stepSpring(
  moving: Moving,
  target: number,
  force: { stiffness: number; damping: number },
  seconds: number,
): Moving {
  let { value, velocity } = moving;
  let left = Math.min(seconds, LONGEST_FRAME);
  while (left > 0) {
    const step = Math.min(SUBSTEP, left);
    velocity += (force.stiffness * (target - value) - force.damping * velocity) * step;
    value += velocity * step;
    left -= step;
  }
  return { value, velocity };
}

/** Whether a value has arrived: as good as there, and as good as still. */
export function atRest(moving: Moving, target: number, within = 0.002) {
  return Math.abs(target - moving.value) < within && Math.abs(moving.velocity) < within * 20;
}
