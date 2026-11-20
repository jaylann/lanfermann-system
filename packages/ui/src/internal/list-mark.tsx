import { TickGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

/*
 * How a list says which of its rows are chosen. No list keeps an empty column on the left for
 * it: a row's words start where its group's label does (Justin, 2026-11-20: "i find myself
 * hating the left space"). Two forms, by what stands at a row's right end (his rule):
 *
 *   nothing  the mark stands there: the disc of ring to disc for one choice (a select, a radio
 *            row, a time), the tick for what is on or off (a checkbox row, a multi-select)
 *   detail   (a price, a place) the chosen row stands on the tint, as the current page of a
 *            `Sidebar` does; a mark after the detail would be a third column
 */

export type ListMarkProps = {
  /** `single` for one choice out of several (the disc), `multiple` for on or off (the tick). */
  kind?: "single" | "multiple";
  /** For a row that has no state of its own to read: chosen or not. */
  on?: boolean;
  className?: string;
};

/**
 * The mark of a chosen row, at the row's right end: every row keeps its slot and only the chosen
 * one shows its mark. The row must be a `group` that says it is chosen with `data-selected`
 * (a select, a combobox) or `data-checked` (a menu), or pass `on`. Put `ml-auto` on it where
 * nothing before it pushes it to the end.
 */
export function ListMark({ kind = "single", on, className }: ListMarkProps) {
  return (
    <span
      aria-hidden
      data-slot="list-mark"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center text-accent group-data-disabled:text-on-disabled",
        className,
      )}
    >
      {kind === "single" ? (
        <span
          className={cn(
            "mark",
            on === undefined
              ? "mark-quiet group-data-checked:mark-on group-data-selected:mark-on"
              : on
                ? "mark-on"
                : "mark-quiet",
          )}
        />
      ) : (
        <TickGlyph
          className={
            on === undefined
              ? "opacity-0 group-data-checked:opacity-100 group-data-selected:opacity-100"
              : on
                ? ""
                : "opacity-0"
          }
        />
      )}
    </span>
  );
}

/**
 * A row with a detail at its right, chosen: it stands on the tint. The tint is a layer of its
 * own under the row's words, so it can fade in and out (`settle`) while the highlight under the
 * pointer and the arrow keys stays instant. Chosen rows that touch are one shape: where a chosen
 * row meets another, both give up their corners there, so only the block's outer corners are
 * round, and a corner eases square or round as a neighbour is taken or given up. Under the
 * pointer a chosen row's tint deepens at once. The muted detail reads below 4.5:1 on the tint,
 * so on a chosen row it takes the body's colour.
 */
export const listTint = [
  "relative isolate",
  "before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:bg-tint before:opacity-0",
  "before:transition-[opacity,border-radius] before:spring-settle motion-reduce:before:transition-opacity",
  "data-selected:before:opacity-100",
  "data-highlighted:before:bg-[color-mix(in_srgb,var(--color-tint),var(--color-fg)_5%)]",
  "data-selected:[&:has(+[data-selected])]:before:rounded-b-none",
  "data-selected:[[data-selected]+&]:before:rounded-t-none",
  "data-selected:[&_[data-slot$=-detail]]:text-fg-body",
  // Forced colours drop the tint: the chosen row is outlined instead.
  "forced-colors:data-selected:outline forced-colors:data-selected:-outline-offset-1",
].join(" ");
