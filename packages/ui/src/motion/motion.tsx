"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * The only door to Motion inside the library. Components import from here, never from
 * `motion/react` directly, so there is one place that decides what the library uses and one copy
 * of Motion's React contexts.
 *
 * Motion is for what CSS cannot do: shared-layout travel, gestures with velocity, content swaps.
 * Enter/exit and plain state changes stay CSS transitions (see styles/motion.css).
 */
export { AnimatePresence, LayoutGroup, motion } from "motion/react";

/**
 * Wraps a Motion-using component so it honours the user's reduced-motion setting without asking
 * apps for a provider. Under reduced motion Motion drops transform and layout animation and keeps
 * opacity.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
