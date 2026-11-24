import type { ReactNode } from "react";

import { Marker } from "@/slides/marker/marker";

export type FindingsProps = {
  /** The finding as a sentence, and what it costs the reader. Four rows at most. */
  items: Array<{ title: ReactNode; text?: ReactNode }>;
  /** Number of the first marker, 1 by default (continue the count on a second slide). */
  start?: number;
};

/**
 * Numbered findings whose markers repeat on the evidence beside them.
 *
 * The reading side of an annotated screenshot: put it in the narrow side of a `Split` beside a
 * `BrowserFrame` or `PhoneFrame` whose `markers` carry the same numbers. A finding names what is
 * wrong in plain words („Die Telefonnummer fehlt im Kopf.“); the line under it says why that
 * matters to a customer.
 */
export function Findings({ items, start = 1 }: FindingsProps) {
  return (
    <ol data-slot="slide-findings" start={start} className="flex flex-col justify-between">
      {items.map((item, index) => (
        <li
          key={index}
          className="grid grid-cols-[48px_1fr] items-start gap-6 border-t border-line py-6 first:border-t-2 first:border-rule"
        >
          <Marker n={start + index} />
          <div className="flex flex-col gap-2">
            <h3 className="text-slide-body leading-[1.3] font-semibold text-fg">{item.title}</h3>
            {item.text ? <p className="text-slide-meta text-fg-muted">{item.text}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
