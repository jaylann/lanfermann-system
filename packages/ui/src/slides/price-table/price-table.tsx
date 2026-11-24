import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

export type PriceTableProps = {
  /** Three positions at most on a slide; a longer offer is a document. `step` is the step a position appears at, with its line; without it the position is there from the start, and so is the head. */
  items: Array<{
    title: ReactNode;
    text?: ReactNode;
    qty?: ReactNode;
    price: ReactNode;
    step?: number;
  }>;
  /** Label and amount of each total row. The last row is the sum and is set strong under the 2px rule. An optional third entry is the step the row appears at, the sum with its rule: give the totals a step after the last position, or the sum stands before what it adds up. */
  totals?: Array<[ReactNode, ReactNode, number?]>;
  /** Column heads. German by default: "Leistung", "Umfang", "Preis". */
  labels?: [string, string, string];
};

/**
 * An offer's positions with scope and price, and the totals on the right.
 *
 * Prices are written the way an invoice writes them: `1.900,00 €` in German, `€1,900.00` in
 * English, with a narrow no-break space before the euro sign in German. Net, VAT and total always
 * appear together. Nothing here is highlighted in the accent: a price is not a selling point.
 * Positions can come one by one when each is explained, the totals after them; an offer the
 * reader checks as a whole stands whole.
 */
export function PriceTable({
  items,
  totals = [],
  labels = ["Leistung", "Umfang", "Preis"],
}: PriceTableProps) {
  // The positions are a real table on 7, 2 and 3 columns. The first two head cells are their span
  // wide as a content box plus the 64px gutter as right padding; the price has no width and takes
  // what is left, its three columns on a full slide. A position is its row's header, which may
  // hold no heading, so its title is a paragraph. The totals are pairs of label and amount on the
  // five columns under scope and price. A position's step is marked on its `<tr>`: its line is the
  // bottom border of its cells (the borders are separate), so it waits with the row.
  return (
    <div data-slot="slide-price-table" className="flex flex-col">
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <th
              scope="col"
              className="box-content slide-span-7 border-b-2 border-rule pr-16 pb-4 text-left align-bottom text-slide-meta font-normal text-fg-muted"
            >
              {labels[0]}
            </th>
            <th
              scope="col"
              className="box-content slide-span-2 border-b-2 border-rule pr-16 pb-4 text-left align-bottom text-slide-meta font-normal text-fg-muted"
            >
              {labels[1]}
            </th>
            <th
              scope="col"
              className="border-b-2 border-rule pb-4 text-right align-bottom text-slide-meta font-normal text-fg-muted"
            >
              {labels[2]}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} {...stepAttributes(item.step)}>
              <th
                scope="row"
                className="border-b border-line py-6 pr-16 text-left align-baseline font-normal"
              >
                <p className="text-slide-body leading-[1.3] font-semibold text-fg">{item.title}</p>
                {item.text ? (
                  <p className="mt-2 text-slide-meta text-fg-muted">{item.text}</p>
                ) : null}
              </th>
              <td className="border-b border-line py-6 pr-16 align-baseline text-slide-body text-fg-body">
                {item.qty}
              </td>
              <td className="border-b border-line py-6 text-right align-baseline text-slide-body text-fg-body tabular-nums">
                {item.price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totals.length > 0 ? (
        <div className="flex justify-end pt-4">
          <dl className="flex slide-span-5 flex-col">
            {totals.map(([label, amount, step], index) => {
              const sum = index === totals.length - 1;
              const type = sum
                ? "text-slide-body leading-[1.3] font-semibold text-fg"
                : "text-slide-body text-fg-body";
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-baseline justify-between",
                    sum ? "border-t-2 border-rule pt-4" : "py-2",
                  )}
                  {...stepAttributes(step)}
                >
                  <dt className={type}>{label}</dt>
                  <dd className={cn(type, "text-right tabular-nums")}>{amount}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

/** The highest step among the positions and the total rows. */
PriceTable.slideSteps = ((props) =>
  Math.max(
    maxStep(props.items),
    maxStep(props.totals?.map(([, , step]) => ({ step }))),
  )) satisfies StepCounter<PriceTableProps>;
