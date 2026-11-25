import type { PlayerIntent } from "./input";
import type { PlayerAction } from "./state";

/**
 * What an intent does to the deck, or `undefined` for the one that does nothing to it: the full
 * screen belongs to the window, not to the deck. `at` is the time of the step, for the talk's
 * clock.
 */
export function actionOfIntent(intent: PlayerIntent, at: number): PlayerAction | undefined {
  switch (intent) {
    case "next":
      return { type: "next", at };
    case "previous":
      return { type: "previous" };
    case "first":
      return { type: "first" };
    case "last":
      return { type: "last" };
    case "blackout":
      return { type: "blackout" };
    case "grid":
      return { type: "grid" };
    case "escape":
      return { type: "escape" };
    case "fullscreen":
      return undefined;
    default:
      return intent satisfies never;
  }
}

/** A click on the slide at `x`: the left half of the box steps back, the right half forward. */
export function intentOfClick(x: number, left: number, width: number): "next" | "previous" {
  return x < left + width / 2 ? "previous" : "next";
}

/**
 * The tile an arrow key, Home or End leads to in the grid of slides, from tile `from` of `count`
 * in rows of `columns`. At an edge the focus stays where it is; any other key is `undefined`,
 * and so not the grid's.
 */
export function tileOfKey(
  key: string,
  from: number,
  count: number,
  columns: number,
): number | undefined {
  const steps: Record<string, number> = {
    ArrowRight: from + 1,
    ArrowLeft: from - 1,
    ArrowDown: from + columns,
    ArrowUp: from - columns,
    Home: 0,
    End: count - 1,
  };
  if (!Object.hasOwn(steps, key)) return undefined;
  const to = steps[key];
  return to === undefined || to < 0 || to >= count ? from : to;
}

/** What a key press is aimed at, as far as the player needs to know it. */
export type KeyTarget = {
  /** The element's tag name, in either case. */
  tagName: string;
  isContentEditable?: boolean;
  /** Has `data-player-scroll`: a box of the console that the arrow keys scroll. */
  scrolls?: boolean;
};

/**
 * Whether a key belongs to what has the focus and not to the deck: anything typed into a field,
 * Enter and Space on a button or a link, and the vertical arrows in a box that scrolls.
 */
export function keyBelongsToTarget(key: string, target: KeyTarget | null): boolean {
  if (!target) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  if (tag === "button" || tag === "a") return key === "Enter" || key === " ";
  if (target.scrolls) return key === "ArrowUp" || key === "ArrowDown";
  return false;
}
