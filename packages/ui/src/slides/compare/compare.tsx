import type { ReactNode } from "react";

export type CompareProps = {
  /** Head of the left column: the state being left behind. */
  left: ReactNode;
  /** Head of the right column: the state being proposed. */
  right: ReactNode;
  /** Pairs that answer the same question. Four rows at most. */
  rows: Array<[ReactNode, ReactNode]>;
};

/**
 * Two columns read against each other, row by row.
 *
 * Each row compares one thing, so both cells of a row answer the same question. The left side
 * steps back into `text-muted`, the right side stands in `text`. No ticks, no crosses, no red and
 * green.
 */
export function Compare({ left, right, rows }: CompareProps) {
  // A real table of two columns of six. Its lines stop at the gutter, so the gutter is the
  // table's `border-spacing`. That also stands outside the first and the last column: the block
  // reaches one gutter into the margin on each side to take it back.
  return (
    <div data-slot="slide-compare" className="-mx-16">
      <table className="w-full table-fixed border-separate border-spacing-x-16">
        <thead>
          <tr>
            <th
              scope="col"
              className="slide-span-6 border-b-2 border-rule pb-4 text-left align-bottom text-slide-meta font-normal text-fg-muted"
            >
              {left}
            </th>
            <th
              scope="col"
              className="slide-span-6 border-b-2 border-rule pb-4 text-left align-bottom text-slide-meta font-normal text-fg-muted"
            >
              {right}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([before, after], index) => (
            <tr key={index}>
              <td className="border-b border-line py-6 align-top text-slide-body text-fg-muted">
                {before}
              </td>
              <td className="border-b border-line py-6 align-top text-slide-body text-fg">
                {after}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
