/**
 * The decisions of a conversation that keeps to its foot, without a browser: where the foot is,
 * which keys mean "I am reading further up", and how far a way back is glided rather than jumped.
 */

/** Within this many pixels of the foot, the reader is at the foot. */
export const AT_FOOT = 4;

export type ScrollBox = Pick<HTMLElement, "scrollTop" | "scrollHeight" | "clientHeight">;

/** How far the view stands above the foot of what it holds, in px. Never below nothing. */
export function aboveFoot({ scrollTop, scrollHeight, clientHeight }: ScrollBox): number {
  return Math.max(0, scrollHeight - clientHeight - scrollTop);
}

/** Where the view stands at the foot. */
export function footOf({ scrollHeight, clientHeight }: ScrollBox): number {
  return Math.max(0, scrollHeight - clientHeight);
}

/** Keys that move a scrolling box up, read where the keyboard is not in a text field. */
export function movesUp(event: Pick<KeyboardEvent, "key" | "shiftKey">): boolean {
  return (
    event.key === "ArrowUp" ||
    event.key === "PageUp" ||
    event.key === "Home" ||
    (event.key === " " && event.shiftKey)
  );
}

/**
 * Where a way back to the foot starts gliding. A long way is not glided all the way: from more
 * than three screens up the view jumps to one screen above the foot and glides the rest, so the
 * reader sees the motion without waiting for it.
 */
export function glideFrom(box: ScrollBox): number {
  const away = aboveFoot(box);
  if (away <= box.clientHeight * 3) return box.scrollTop;
  return footOf(box) - box.clientHeight;
}
