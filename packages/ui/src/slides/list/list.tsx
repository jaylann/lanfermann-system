import type { ReactNode } from "react";

export type ListProps = {
  /** One sentence per row. Open a row with <b>two or three words</b> when the rows need names. */
  items: ReactNode[];
};

/**
 * Up to five plain rows separated by hairlines.
 *
 * The kit's bullet list: rows and lines, no bullets, no numbers, no icons. Rows are parallel in
 * form (all sentences, or all noun phrases) and none runs past two lines. When the rows are steps
 * in time, use `Steps`; when each has a term, use `KeyValue`.
 */
export function List({ items }: ListProps) {
  return (
    <ul data-slot="slide-list" className="flex flex-col">
      {items.map((item, index) => (
        <li
          key={index}
          data-lines={2}
          className="border-t border-line py-6 text-slide-body text-fg-body first:border-t-2 first:border-rule"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
