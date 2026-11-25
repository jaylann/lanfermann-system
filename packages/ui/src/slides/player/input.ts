/**
 * What a key or a swipe means. Pure, so the table can be read and tested: a clicker is a keyboard
 * that sends PageDown and PageUp, and some send „b“ or „.“ for the black screen.
 */
export type PlayerIntent =
  "next" | "previous" | "first" | "last" | "blackout" | "grid" | "fullscreen" | "escape";

type Key = {
  key: string;
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
};

const KEYS: Record<string, PlayerIntent> = {
  ArrowRight: "next",
  ArrowDown: "next",
  PageDown: "next",
  Enter: "next",
  " ": "next",
  ArrowLeft: "previous",
  ArrowUp: "previous",
  PageUp: "previous",
  Backspace: "previous",
  Home: "first",
  End: "last",
  b: "blackout",
  ".": "blackout",
  g: "grid",
  f: "fullscreen",
  Escape: "escape",
};

/**
 * The intent of a key press, or `undefined` when the key is not the player's: any key held with
 * Ctrl, Alt or Cmd belongs to the browser. Shift turns Space around, as it does when paging.
 */
export function intentOfKey({ key, shiftKey, altKey, ctrlKey, metaKey }: Key) {
  if (altKey || ctrlKey || metaKey) return undefined;
  if (key === " " && shiftKey) return "previous";
  return KEYS[key.length === 1 ? key.toLowerCase() : key];
}

/** A swipe has to travel this far, in CSS px, to count. */
export const SWIPE_DISTANCE = 48;
/** And be this many times as wide as it is high: a scroll or a slanted drag is not a swipe. */
export const SWIPE_RATIO = 1.5;

/** The intent of a touch that moved by `dx` and `dy`: to the left is forward. */
export function intentOfSwipe(dx: number, dy: number): "next" | "previous" | undefined {
  if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return undefined;
  return dx < 0 ? "next" : "previous";
}
