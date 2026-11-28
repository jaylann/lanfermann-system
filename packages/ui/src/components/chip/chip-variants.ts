/**
 * The look of a chip as class names, for the two places that draw one: `Chip`, and the field of
 * a multi-select, whose chips are Base UI's own parts. Server-safe, like `buttonVariants`.
 */

/**
 * As wide as its text. Where a chip may be too long for its row, give it a `max-w-*`: the text
 * then ends in an ellipsis.
 */
export const chipShape =
  "inline-flex h-[1.375rem] w-max items-center gap-1 rounded-sm px-2 align-middle text-sm font-medium whitespace-nowrap";

/** `plug`: raised, a small fitting. `flat`: a quiet wash with a faint edge, like a `Badge`. */
export const chipFace = {
  plug: "bg-raised depth-plug text-fg",
  flat: "bg-surface-quiet text-fg-body inset-ring inset-ring-current/15 forced-colors:outline",
} as const;

export type ChipVariant = keyof typeof chipFace;

export const chipDisabledLook =
  "data-disabled:bg-disabled data-disabled:depth-flat data-disabled:text-on-disabled";

/**
 * In a row that is live it seats into its place once that has begun to open, and leaves by
 * fading before the place closes: an exit does not scale back.
 */
export const chipMotion = [
  "transition-[opacity,scale] delay-75 spring-seat in-data-live:starting:scale-90 in-data-live:starting:opacity-0 motion-reduce:in-data-live:starting:scale-100",
  "in-data-leaving:opacity-0 in-data-leaving:delay-0 in-data-leaving:spring-leave",
].join(" ");

/** The key that takes the chip away: 18px in the chip, a finger's target around it. */
export const chipRemoveKey = [
  "touch-target relative flex size-[1.125rem] shrink-0 items-center justify-center rounded-xs text-fg-muted select-none",
  "hover:bg-hover hover:text-fg",
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent",
].join(" ");
