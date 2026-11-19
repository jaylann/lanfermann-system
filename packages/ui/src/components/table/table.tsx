import type { ComponentProps } from "react";

import { ScrollFade } from "@/components/scroll-fade/scroll-fade";
import { ArrowUpGlyph } from "@/internal/glyphs";
import { ruleTop } from "@/internal/rule";
import { cn } from "@/lib/cn";

/** A table scrolls sideways in its own region, and a region needs a name. */
type Named =
  | { "aria-label": string; "aria-labelledby"?: undefined }
  | { "aria-labelledby": string; "aria-label"?: undefined };

export type TableProps = Omit<ComponentProps<"table">, "aria-label" | "aria-labelledby"> &
  Named & {
    /** Classes for the box around the table (its rule and the scrolling region): its place. */
    containerClassName?: string;
    /**
     * What the cells hold. `data` (the default): short values, centred on the row's line.
     * `text`: sentences, as in a reference or the docs. Cells then start at the row's top, so a
     * long cell does not push the short ones beside it down to its middle.
     */
    content?: "data" | "text";
    /**
     * Below `sm`, every row becomes a block of its own and each cell is named by its column
     * (`TableCell label`), instead of the table scrolling sideways. For tables of text with two
     * or three columns, which a phone cannot show side by side. It stays a table to assistive
     * tech.
     */
    stack?: boolean;
    /**
     * How the table is set. Temporary: the refinements on the board `Lab/Table 2026-11-19`, to
     * be compared until one is picked and the others go. All but `default` share the rhythm of
     * `tight`, which Justin picked from the first round (2026-11-19).
     * - `tight`: today's anatomy on a tighter rhythm. Rows of 15px text (`text-control`, it
     *   follows the density) with 8px above and below, at least a large control high; a column
     *   heading as high as a control; what stands inline in a cell (a badge, avatars, a
     *   checkbox) is centred on the text; numbers in the text colour. A run of selected rows is
     *   one wash. Still under the 2px rule.
     * - `card`: for a table that stands in a `Card`, under the card's head. No rule: the card's
     *   edge holds the rows. The column names stand in a quiet band (the well, a hairline under
     *   it; a head above brings its own), the outer cells keep the card's 20px, and the last row
     *   has no line under it: the card's edge closes the table. The card clips the last wash.
     * - `open`: on the page's ground with no rule: the heading above opens the table, the column
     *   names stand bare over a hairline. The table reaches 12px past its column on both sides,
     *   so its text and its lines stand on the column's edges; the washes are rounded like a
     *   sidebar's rows and run past the text, a run of selected rows is one shape, and the
     *   hairlines next to a washed row step aside (`styles/table.css`).
     * - `band`: like `open`, but the column names stand in a rounded band on the quiet surface
     *   in place of a line, and the rows are divided by their rhythm alone.
     */
    look?: TableLook;
  };

/** The looks a `Table` can take while the refinement is open (see `TableProps.look`). */
export type TableLook = "default" | "tight" | "card" | "open" | "band";

/**
 * Rows of the same kind of thing, compared column by column: quotes, invoice lines, members.
 * Real `<table>` markup, structured by line and not by box: a 2px rule with round ends opens it,
 * hairlines divide the rows, no stripes and no card around it.
 *
 * On a narrow screen the table keeps its columns and scrolls sideways inside its own region,
 * which is focusable so the keyboard can scroll it too. Its edges fade where more columns wait;
 * the rule above stays whole. Name it with `aria-label` (or `aria-labelledby`, pointing at a
 * heading or the `TableCaption`). Give the table a `min-w-*` if its columns must not squeeze.
 *
 * Sorting, filtering and paging are the caller's state; the table only provides the slots.
 */
export function Table({
  className,
  containerClassName,
  content = "data",
  stack = false,
  look = "default",
  "aria-label": label,
  "aria-labelledby": labelledBy,
  ...props
}: TableProps) {
  // Only a refined look is named in the markup, so `in-data-look:` means "one of the refinements".
  const refined = look === "default" ? undefined : look;
  // The looks whose washes are rounded and run past the text, which stands on the column's edge.
  const rounded = look === "open" || look === "band";
  return (
    <div
      data-slot="table-container"
      data-look={refined}
      className={cn(
        // The rule and the focus outline are drawn here, outside the region's edge mask, which
        // would fade them with the columns.
        (look === "default" || look === "tight") && ruleTop,
        "rounded-xs",
        "has-[[data-slot=table-scroll]:focus-visible]:outline-2",
        "has-[[data-slot=table-scroll]:focus-visible]:outline-offset-2",
        "has-[[data-slot=table-scroll]:focus-visible]:outline-accent",
        // A rounded look reaches past its column by a cell's padding, so its text stands on the
        // column's edge and its washes run past the text.
        rounded && "-mx-3",
        // In a card the table ends at the card's rounded foot, and its focus ring stays inside
        // the card's edge.
        look === "card" &&
          "rounded-b-xl has-[[data-slot=table-scroll]:focus-visible]:-outline-offset-2",
        containerClassName,
      )}
    >
      <ScrollFade
        axis="x"
        data-slot="table-scroll"
        role="region"
        aria-label={label}
        aria-labelledby={labelledBy}
        tabIndex={0}
        className={cn(
          // `relative`: what is positioned inside (a visually hidden column name, a touch target)
          // then belongs to this box and scrolls with it, instead of widening the page.
          "relative w-full overflow-x-auto focus-visible:outline-hidden",
          // What takes the keyboard focus inside is scrolled clear of the fade.
          "scroll-px-10",
          // In a card the region's rounded foot clips the wash of the last row.
          look === "card" && "rounded-b-xl",
        )}
      >
        <table
          data-slot="table"
          data-content={content}
          data-stack={stack ? "" : undefined}
          data-look={refined}
          data-rounded={rounded ? "" : undefined}
          // The roles are written out because a stacked table is no longer laid out as one, and
          // some browsers then stop telling assistive tech that it is a table.
          role="table"
          className={cn(
            "w-full caption-bottom border-collapse text-left text-base text-fg-body",
            "data-stack:max-sm:block",
            refined && "text-control",
            // Separate cells can round their corners, which the rounded washes need; the lines are
            // then drawn by the cells (`styles/table.css`), as rows have no border in this model.
            rounded && "border-separate border-spacing-0",
            className,
          )}
          {...props}
        />
      </ScrollFade>
    </div>
  );
}

/*
 * The stacked layout, below `sm`: the column names leave the screen (they stay for assistive
 * tech), rows and cells become blocks, and each cell shows its column's name above its value.
 */
const stackedGroup = "in-data-stack:max-sm:block";
const stackedRow = "in-data-stack:max-sm:block in-data-stack:max-sm:py-3";
const stackedCell = [
  "in-data-stack:max-sm:block in-data-stack:max-sm:px-0 in-data-stack:max-sm:py-1 in-data-stack:max-sm:whitespace-normal",
  // The first cell names the row, so it reads as the block's title.
  "in-data-stack:max-sm:first:font-medium in-data-stack:max-sm:first:text-fg",
  "in-data-stack:max-sm:before:block in-data-stack:max-sm:before:pb-0.5 in-data-stack:max-sm:before:text-sm in-data-stack:max-sm:before:text-fg-muted in-data-stack:max-sm:before:content-[attr(data-label)]",
].join(" ");

/** A line under the table that says what it shows, or where its numbers come from. */
export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("pt-3 text-left text-sm text-fg-muted", className)}
      {...props}
    />
  );
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      role="rowgroup"
      className={cn("in-data-stack:max-sm:sr-only", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      role="rowgroup"
      className={cn(
        stackedGroup,
        // In a card the card's edge closes the table: no line under the last row.
        "in-data-[look=card]:[&>tr:last-child]:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

/** The sum line: set off by the structural line, in the weight of a result. */
export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      role="rowgroup"
      className={cn(
        "border-t border-line font-medium text-fg [&>tr:last-child]:border-b-0",
        stackedGroup,
        className,
      )}
      {...props}
    />
  );
}

export type TableRowProps = ComponentProps<"tr"> & {
  /**
   * The row can be opened: it is washed under the pointer. The wash is feedback only; put the
   * real link or button inside the row, so it works from the keyboard.
   */
  interactive?: boolean;
  /** The row is part of the current selection: washed in the tint. */
  selected?: boolean;
};

export function TableRow({ className, interactive, selected, ...props }: TableRowProps) {
  return (
    <tr
      data-slot="table-row"
      role="row"
      data-interactive={interactive ? "" : undefined}
      data-selected={selected ? "" : undefined}
      aria-selected={selected}
      className={cn(
        "group/row border-b border-hairline",
        // Instant, like the highlight of a menu: it follows the pointer without lag. In a rounded
        // look the cells carry the wash instead, so its ends can be rounded.
        "not-in-data-rounded:data-interactive:hover:bg-hover data-selected:text-fg not-in-data-rounded:data-selected:bg-tint",
        // A refined look: rows selected one after another are one wash, without a line across it.
        "in-data-look:data-selected:has-[+[data-selected]]:border-b-tint",
        stackedRow,
        className,
      )}
      {...props}
    />
  );
}

// Every cell keeps 12px to its sides, the outer ones too: the lines and a row's wash run a
// little past the text, so a washed row does not have its text pressed against the edge.
// In a table of text the cells start at the row's top.
const cell = [
  "px-3 text-left align-middle in-data-[content=text]:align-top",
  // In a card the outer cells keep the card's own 20px, so the text stands under its head.
  "in-data-[look=card]:first:pl-5 in-data-[look=card]:last:pr-5",
].join(" ");
const numeric = "text-right tabular-nums whitespace-nowrap";

export type TableHeadProps = ComponentProps<"th"> & {
  /** A column of numbers: its heading stands right, above the digits. */
  numeric?: boolean;
  /** How the table is sorted by this column, for assistive tech. Use with a `TableSortButton`. */
  sort?: "ascending" | "descending" | "none";
};

/** A column heading: small and muted, so the rows are what is read. */
export function TableHead({ className, numeric: isNumeric, sort, ...props }: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      role="columnheader"
      aria-sort={sort}
      className={cn(
        cell,
        "h-(--control-lg) text-sm font-normal whitespace-nowrap text-fg-muted",
        // In a refined look the column names stand in a band as high as a control; in a card the
        // band is the well.
        "in-data-look:h-(--control-md) in-data-[look=card]:bg-well",
        // A column name over sentences stands at the top as well, in its own small line.
        "in-data-[content=text]:pb-2 in-data-[content=text]:align-bottom",
        isNumeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export type TableCellProps = ComponentProps<"td"> & {
  /** A number: set right, in tabular digits, so the column lines up. */
  numeric?: boolean;
  /** The name of the cell's column, shown above it when the table is stacked on a phone. */
  label?: string;
  /** Kept on one line, like a name in code that must not break. A stacked table still wraps it. */
  nowrap?: boolean;
};

export function TableCell({
  className,
  numeric: isNumeric,
  label,
  nowrap = false,
  ...props
}: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      role="cell"
      data-label={label}
      className={cn(
        cell,
        // Only the style of wrapping: `text-pretty` would also switch wrapping back on, and a
        // `nowrap` cell would wrap again.
        "py-3 in-data-[content=text]:[text-wrap-style:pretty]",
        // A refined look: 8px above and below. What stands inline in the cell (a badge, avatars,
        // a checkbox) is centred on the text's x-height instead of standing on its baseline,
        // which made a row with a picture taller than one with initials.
        // A row is at least a large control high (the height of a cell is its least), and its
        // cells are centred on it, as today.
        "in-data-look:h-(--control-lg) in-data-look:py-2 in-data-look:*:align-middle",
        isNumeric && numeric,
        isNumeric && "in-data-look:text-fg",
        nowrap && "whitespace-nowrap",
        stackedCell,
        className,
      )}
      {...props}
    />
  );
}

export type TableSortButtonProps = ComponentProps<"button"> & {
  /** The current direction, if the table is sorted by this column. */
  direction?: "ascending" | "descending";
};

/**
 * The heading of a sortable column, as a button. An arrow shows the direction and turns over
 * (`seat`) when it changes; an unsorted column shows it faintly under the pointer. Keep the state
 * yourself, and put the same direction on the `TableHead` as `sort`.
 */
export function TableSortButton({
  className,
  direction,
  children,
  ...props
}: TableSortButtonProps) {
  return (
    <button
      type="button"
      data-slot="table-sort-button"
      data-direction={direction}
      className={cn(
        "group/sort touch-target relative -mx-1.5 inline-flex h-(--control-sm) items-center gap-1 rounded-sm px-1.5 text-sm text-fg-muted select-none",
        "hover:bg-hover hover:text-fg data-direction:text-fg",
        "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent",
        className,
      )}
      {...props}
    >
      {children}
      <ArrowUpGlyph
        className={cn(
          "transition-[rotate,opacity] spring-seat",
          direction ? "opacity-100" : "opacity-0 group-hover/sort:opacity-50",
          direction === "descending" && "rotate-180",
        )}
      />
    </button>
  );
}
