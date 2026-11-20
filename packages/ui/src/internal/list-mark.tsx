"use client";

import { createContext, useContext } from "react";

import { TickGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

/**
 * How a list says which of its rows are chosen (Justin, 2026-11-20: "i find myself hating the
 * left space"), on the lab board until he picks. Each form leaves the left edge to the labels,
 * so a row's text starts where its group's label does.
 *
 *   tick    a tick at the row's right end, after its detail, in a slot every row keeps, so the
 *           details still line up in a column (the W3C combobox, Cognite Aura, Amex)
 *   tint    the chosen row stands on the tint, as the current page of a `Sidebar` does
 *   accent  the chosen row's label in the accent, at medium weight
 *
 * `single` is the mark of a choice of one in `tick`: the tick, or the disc of ring to disc.
 */
export type ListMarking = { marking: "tick" | "tint" | "accent"; single: "tick" | "disc" };

export const ListMarkingContext = createContext<ListMarking>({ marking: "tick", single: "tick" });

/** The marking the rows below are drawn in. */
export function useListMarking(): ListMarking {
  return useContext(ListMarkingContext);
}

/**
 * What a chosen row wears besides its mark, for the forms that have no mark. The row is chosen
 * when it carries `data-selected` (a select, a combobox), `data-checked` (a menu) or
 * `data-chosen` (a list that knows it itself, the times of a `TimeField`).
 */
export const listChosen: Record<ListMarking["marking"], string> = {
  tick: "",
  tint: [
    "data-selected:bg-tint data-checked:bg-tint data-chosen:bg-tint",
    // The muted detail falls under 4.5:1 on the tint; on a chosen row it takes the body's colour.
    "data-selected:[&_[data-slot$=-detail]]:text-fg-body data-chosen:[&_[data-slot$=-detail]]:text-fg-body",
    "data-highlighted:data-selected:bg-[color-mix(in_srgb,var(--color-tint),var(--color-fg)_5%)] data-highlighted:data-checked:bg-[color-mix(in_srgb,var(--color-tint),var(--color-fg)_5%)] data-highlighted:data-chosen:bg-[color-mix(in_srgb,var(--color-tint),var(--color-fg)_5%)]",
  ].join(" "),
  accent: [
    "data-selected:font-medium data-checked:font-medium data-chosen:font-medium",
    "data-selected:text-accent data-checked:text-accent data-chosen:text-accent",
  ].join(" "),
};

export type ListMarkProps = {
  /** `single` for one choice out of several (a select, a radio row), `multiple` for a tick. */
  kind?: "single" | "multiple";
  /** For a row that has no state of its own to read: chosen or not. */
  on?: boolean;
  className?: string;
};

/**
 * The mark of a chosen row, at the row's right end. Every row keeps its slot, so whatever stands
 * before it (a detail) lines up from row to row; only the chosen row shows its mark. The row
 * must be a `group`. Put `ml-auto` on it where nothing before it pushes it to the end.
 */
export function ListMark({ kind = "single", on, className }: ListMarkProps) {
  const { marking, single } = useListMarking();
  if (marking !== "tick") return null;
  // Shown on the row's own state, or on `on` where the row has none.
  const shown =
    on === undefined
      ? "opacity-0 group-data-selected:opacity-100 group-data-checked:opacity-100"
      : on
        ? ""
        : "opacity-0";
  return (
    <span
      aria-hidden
      data-slot="list-mark"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center text-accent group-data-disabled:text-on-disabled",
        className,
      )}
    >
      {kind === "single" && single === "disc" ? (
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
        <TickGlyph className={shown} />
      )}
    </span>
  );
}
