import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { span } from "@/slides/lib/grid";

export type TableProps = {
  /** `span` is the number of grid columns; the spans add up to 12 (or to the columns of the Split side the table sits in). `numeric` right-aligns with tabular figures. `mono` sets literal strings in the mono face. */
  columns: Array<{
    key: string;
    label: ReactNode;
    span: number;
    numeric?: boolean;
    mono?: boolean;
  }>;
  /** One object per row, keyed like the columns. Six rows at most, eight when dense. */
  rows: Array<Record<string, ReactNode>>;
  /** Cells at 24px with tighter rows. */
  dense?: boolean;
  /** Row index and column key of the one cell the title is about. */
  highlight?: [number, string];
};

/**
 * A data table on the 12-column grid with one highlighted cell.
 *
 * The first column names the row and is set strong. Numbers are right-aligned with tabular
 * figures and their column head is right-aligned too. Exactly one cell may carry the accent: the
 * datum the title talks about. No zebra bands, no tinted row, no vertical lines, no icons in
 * cells. Write values the way a person says them („18 von 20“, not „18/20“). A method line
 * follows directly under the last row.
 */
export function Table({ columns, rows, dense = false, highlight }: TableProps) {
  // A real table laid out on the slide's grid. A head cell's width is its span as a content box,
  // and the 64px gutter is the right padding of every cell but the last, so a column starts where
  // its grid track would. The last column has no width and takes what is left: its own span when
  // the spans add up to the block the table stands in.
  const last = columns.length - 1;
  return (
    <table data-slot="slide-table" className="w-full table-fixed border-separate border-spacing-0">
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th
              key={column.key}
              scope="col"
              className={cn(
                "box-content border-b-2 border-rule pr-16 pb-4 align-bottom text-slide-meta font-normal text-fg-muted last:pr-0",
                column.numeric ? "text-right" : "text-left",
              )}
              style={index < last ? { width: span(column.span) } : undefined}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, columnIndex) => {
              const first = columnIndex === 0;
              const highlighted =
                highlight != null && highlight[0] === rowIndex && highlight[1] === column.key;
              const Cell = first ? "th" : "td";
              return (
                <Cell
                  key={column.key}
                  scope={first ? "row" : undefined}
                  className={cn(
                    "border-b border-line pr-16 align-baseline last:pr-0",
                    dense ? "py-4" : "py-6",
                    column.mono
                      ? "text-left font-mono text-slide-code font-normal text-fg-muted"
                      : [
                          dense ? "text-slide-meta" : "text-slide-body",
                          first || highlighted ? "font-semibold" : "font-normal",
                          highlighted ? "text-accent" : first ? "text-fg" : "text-fg-body",
                          column.numeric ? "text-right tabular-nums" : "text-left",
                        ],
                  )}
                >
                  {row[column.key]}
                </Cell>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
