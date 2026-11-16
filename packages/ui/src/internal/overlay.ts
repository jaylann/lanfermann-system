/**
 * The shared look of the two modal sheets, Dialog and AlertDialog. They are separate Base UI
 * primitives with identical parts, so the class names live here once.
 */

/**
 * The scrim, as tall as the window with the browser's bars collapsed (`lvh`). Safari 26 tints
 * its status bar and toolbar from what lies under them, so the scrim dims those too and no light
 * strip stays above or below it.
 */
export const overlayBackdrop =
  "fixed inset-x-0 top-0 z-50 h-lvh bg-scrim transition-opacity duration-200 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0";

/**
 * Centres the sheet and keeps it inside the window; long content scrolls inside the sheet. On a
 * phone "the window" is what is visible right now (`dvh`: the browser's bars come and go) and
 * ends above the home indicator.
 */
export const overlayViewport =
  "fixed inset-0 z-50 flex max-h-dvh items-center justify-center overflow-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))]";

/**
 * The sheet rises 8px into place on `sheet` and leaves by fading, without travel. Behind a nested
 * dialog it steps back a little (`--nested-dialogs` is 0 otherwise).
 */
export const overlayPopup = [
  "relative flex max-h-full w-full max-w-md flex-col gap-5 rounded-2xl bg-sheet p-6 text-base text-fg-body depth-overlay outline-hidden",
  "translate-y-[calc(-0.75rem*var(--nested-dialogs,0))] scale-[calc(1-0.04*var(--nested-dialogs,0))]",
  "transition-[opacity,scale,translate] spring-sheet",
  "data-starting-style:translate-y-2 data-starting-style:scale-(--motion-enter-scale) data-starting-style:opacity-0",
  "data-ending-style:opacity-0 data-ending-style:spring-leave",
].join(" ");

/** Room on the right for the close button in the corner. */
export const overlayHeader = "flex flex-col gap-1.5 pr-8";

export const overlayTitle = "text-lg leading-snug font-semibold text-balance text-fg";

export const overlayDescription = "text-fg-body";

/**
 * The part that scrolls when the content is long. It bleeds to the sheet's edges, and keeps 4px
 * of its own so the focus halo of a field at the edge is not clipped.
 */
export const overlayBody = "-mx-6 -my-1 min-h-0 overflow-y-auto px-6 py-1";

/** Actions, right-aligned: the way out on the left, the committed action last. */
export const overlayFooter = "flex flex-wrap items-center justify-end gap-2 pt-1";
