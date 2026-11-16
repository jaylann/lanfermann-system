/**
 * The spring table: the single source of truth for motion in @lanfermann/ui.
 *
 * It feeds two consumers so that CSS and JavaScript animation feel identical:
 *   - Motion (`motion/react`) through `transitions` below;
 *   - plain CSS through `src/styles/motion.generated.css`, written by `bun run gen:motion`
 *     (a test fails when the two drift).
 *
 * `visualDuration` is the time until the motion looks finished; a bouncy spring keeps settling a
 * little longer. `bounce` 0 is critically damped. Bounce is reserved for small parts (24px or
 * less), for things the user threw, and for parts let go where there is room for their swing.
 *
 * This module is pure data: no "use client", no Motion import, safe on the server.
 */
export const springs = {
  /** Press down, hover, pointer focus. */
  snap: { visualDuration: 0.12, bounce: 0 },
  /** The default: popups entering, panels opening, an error revealing. */
  settle: { visualDuration: 0.24, bounce: 0 },
  /** A small part seating: ring to disc, a check, a switch thumb, a button released. */
  seat: { visualDuration: 0.28, bounce: 0.22 },
  /**
   * A mark travelling inside its container: the tab highlight, the segment thumb. No bounce: a
   * thumb that overshoots would poke through the wall of its trough.
   */
  glide: { visualDuration: 0.32, bounce: 0 },
  /** A sheet arriving: dialog, toast. */
  sheet: { visualDuration: 0.36, bounce: 0 },
  /** Every exit: faster than the entrance, no bounce, no travel. */
  leave: { visualDuration: 0.16, bounce: 0 },
  /** Releasing a drag with its velocity (Motion only). */
  throw: { visualDuration: 0.4, bounce: 0.15 },
  /**
   * Parts that were pushed together and are let go: the marks of a `CopyPill` fanning back out.
   * Each swings past its place once, by about a twentieth of its way, and settles. Only for a
   * transform, and only where the container leaves room for that swing: a width on this spring
   * makes the container itself swing.
   */
  recoil: { visualDuration: 0.36, bounce: 0.3 },
  /**
   * A soft body coming to rest: a slider's thumb that was stretched by its own travel. It swings
   * past its shape once, visibly (the squash), and settles. Only for a deformation of a few
   * pixels; nothing travels on it.
   */
  rebound: { visualDuration: 0.3, bounce: 0.5 },
} as const;

export type SpringName = keyof typeof springs;

export const springNames = Object.keys(springs) as SpringName[];

/** The springs as Motion transitions: `transition={transitions.seat}`. */
export const transitions = Object.fromEntries(
  springNames.map((name) => [name, { type: "spring", ...springs[name] }]),
) as { [K in SpringName]: { type: "spring" } & (typeof springs)[K] };
