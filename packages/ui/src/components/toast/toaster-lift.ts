"use client";

import { type RefObject, useEffect } from "react";

/** How much of the window's foot each docked part takes right now, by a key of its own. */
const lifts = new Map<symbol, number>();

/** The custom property the `Toaster`'s stack reads: the tallest docked part decides. */
function write(): void {
  const lift = Math.max(0, ...lifts.values());
  const root = document.documentElement;
  if (lift > 0) root.style.setProperty("--toaster-lift", `${lift}px`);
  else root.style.removeProperty("--toaster-lift");
  // Said as an attribute too, so the stack can tell rising (at once) from coming back down
  // (once the part that held it up has faded).
  root.toggleAttribute("data-toaster-lifted", lift > 0);
}

/** A part counts as docked while its lower edge is within this many px of the window's foot. */
const FOOT = 64;
/** The stack's own column where no `Toaster` is in the page to measure: 24px in, 360px wide. */
const COLUMN = 384;

/**
 * How much room a part takes at the window's foot where the toasts stand: the distance from its
 * top edge to the window's foot, or nothing if it is not at the foot (a sticky bar that has not
 * reached it) or stands clear of the toasts' column (a narrow bar in the middle of a wide
 * window). Its place is read without the way it still has to travel, so a bar that is rising
 * is measured where it will stand.
 */
export function liftOf(
  part: { top: number; bottom: number; right: number },
  travel: number,
  windowHeight: number,
  columnLeft: number,
): number {
  const top = part.top - travel;
  const bottom = part.bottom - travel;
  const atFoot = bottom > windowHeight - FOOT && top < windowHeight;
  const inColumn = part.right > columnLeft;
  return atFoot && inColumn ? Math.max(0, windowHeight - top) : 0;
}

function measure(element: HTMLElement): number {
  const box = element.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return 0;
  const moved = getComputedStyle(element).translate;
  const travel = moved === "none" ? 0 : Number.parseFloat(moved.split(" ")[1] ?? "0") || 0;
  const stack = document.querySelector('[data-slot="toast-viewport"]')?.getBoundingClientRect();
  const columnLeft = stack ? stack.left : window.innerWidth - Math.min(COLUMN, window.innerWidth);
  // A little before the column, so a bar that almost touches a toast still lifts it.
  return liftOf(box, travel, window.innerHeight, columnLeft - 12);
}

/**
 * Lifts the `Toaster`'s stack above a part that is docked at the foot of the window (a bar of
 * actions, a composer), so a toast never covers it. Call it in the docked part with its element;
 * the stack rises by itself while the part is there and comes back down when it leaves, and
 * with several docked parts the tallest decides. `ActionBar` already does this.
 *
 * It only lifts while the part really stands at the window's foot and under the toasts' column:
 * a sticky bar further up the page, or a narrow bar in the middle of a wide window, moves
 * nothing. `active` is whether the part is there at all (an open bar).
 */
export function useToasterLift(ref: RefObject<HTMLElement | null>, active = true): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || !active) return;
    const key = Symbol("docked");
    let frame = 0;
    /** Transitions of the part's own height still running: it is measured on every frame. */
    let growing = 0;
    const update = () => {
      frame = 0;
      const lift = measure(element);
      if (lifts.get(key) !== lift) {
        lifts.set(key, lift);
        write();
      }
      if (growing > 0) frame = requestAnimationFrame(update);
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };
    const grows = (event: TransitionEvent) => event.propertyName === "height";
    const started = (event: TransitionEvent) => {
      if (!grows(event)) return;
      growing += 1;
      schedule();
    };
    const ended = (event: TransitionEvent) => {
      if (grows(event)) growing = Math.max(0, growing - 1);
      schedule();
    };
    update();
    // A size observer would be the obvious watch, but a `Grow` inside the part sizes its box
    // from inside one, and a second one around it ends each change in an undelivered
    // notification. What changes a docked part's box is listened for instead.
    element.addEventListener("transitionrun", started);
    element.addEventListener("transitionend", ended);
    element.addEventListener("transitioncancel", ended);
    window.addEventListener("resize", schedule);
    // Capturing, so the scrolling of a box around a sticky part is heard as well.
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("transitionrun", started);
      element.removeEventListener("transitionend", ended);
      element.removeEventListener("transitioncancel", ended);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, { capture: true });
      lifts.delete(key);
      write();
    };
  }, [ref, active]);
}
