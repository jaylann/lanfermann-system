/**
 * How every floating sheet (menu, select, popover, tooltip) enters and leaves. Base UI sets
 * `data-starting-style` for the first frame and `data-ending-style` while closing, and keeps the
 * popup mounted until its transition has finished.
 *
 * The sheet grows out of its trigger (`--transform-origin`) on `settle` and leaves on the shorter
 * `leave`, without travel. `data-instant` (keyboard navigation, moving between neighbouring
 * triggers) skips the animation altogether.
 */
export const popupMotion = [
  "origin-(--transform-origin) transition-[opacity,scale] spring-settle",
  "data-starting-style:scale-(--motion-enter-scale) data-starting-style:opacity-0",
  "data-ending-style:opacity-0 data-ending-style:spring-leave",
  "data-instant:transition-none",
].join(" ");

/** The face of a sheet that holds a list (menu, select): 4px of padding around its rows. */
// `outline-hidden`, not `outline-none`: it keeps an outline for forced-colours mode.
export const listSheet = "rounded-xl bg-sheet p-1 text-fg depth-floating outline-hidden";

/**
 * A row in such a list. It takes the concentric radius of the sheet. The highlight is instant: it
 * follows the pointer and the arrow keys without lag. Focus stays on the popup, so the row has no
 * outline of its own.
 */
export const listItem = [
  "flex min-h-(--control-item) cursor-default items-center gap-2.5 rounded-[calc(var(--radius-xl)-4px)] px-2.5 py-1 text-control text-fg outline-none select-none",
  "data-highlighted:bg-hover",
  // Forced colours drop the wash, so the highlighted row takes the system's selection colours.
  "forced-colors:data-highlighted:bg-[color:Highlight] forced-colors:data-highlighted:text-[color:HighlightText]",
  "data-disabled:text-on-disabled",
].join(" ");

export const listGroupLabel = "px-2.5 pt-2 pb-1 text-sm text-fg-muted";

export const listSeparator = "mx-2.5 my-1 h-px bg-hairline forced-colors:bg-[color:GrayText]";

/**
 * The second, quieter fact of a row (a price, a place, a code), pushed to the right edge with
 * tabular digits so it lines up from row to row. It never shrinks: the label gives way.
 */
export const listItemDetail = "ml-auto shrink-0 pl-3 whitespace-nowrap text-fg-muted tabular-nums";
