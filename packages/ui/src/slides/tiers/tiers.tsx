import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

export type TiersProps = {
  /** `unit` says how the price is charged („einmalig“, „pro Monat“). `includes` lists up to five lines. `recommended` puts one price in `accent`. `step` is the step a tier appears at, whole and with its rule; without it the tier is there from the start. */
  items: Array<{
    name: ReactNode;
    price: ReactNode;
    unit?: ReactNode;
    text?: ReactNode;
    includes: ReactNode[];
    recommended?: boolean;
    step?: number;
  }>;
};

/**
 * Two or three offers as ruled columns: name, price, what is included.
 *
 * Columns under rules, not cards: no boxes, no badges, no tick icons, no „most popular“ ribbon.
 * The recommended tier is marked by its price in the accent and by saying so in its `text` line.
 * Every tier lists the same kind of thing in the same order so the columns can be read across.
 * Offers are compared, so they stand together; one tier per step suits only a talk that builds
 * from the smallest offer to the largest.
 */
export function Tiers({ items }: TiersProps) {
  return (
    <div
      data-slot="slide-tiers"
      className="grid gap-16"
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 border-t-2 border-rule pt-6"
          {...stepAttributes(item.step)}
        >
          <h3 className="text-slide-body leading-[1.3] font-semibold text-fg">{item.name}</h3>
          <div className="flex items-baseline gap-3">
            <p
              className={cn(
                "text-slide-title leading-none font-medium",
                item.recommended ? "text-accent" : "text-fg",
              )}
            >
              {item.price}
            </p>
            {item.unit ? <p className="text-slide-meta text-fg-muted">{item.unit}</p> : null}
          </div>
          {item.text ? <p className="text-slide-meta text-fg-muted">{item.text}</p> : null}
          <ul className="flex flex-col">
            {item.includes.map((line, lineIndex) => (
              <li
                key={lineIndex}
                className="border-t border-line py-3 text-slide-meta text-fg-body"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** The highest `step` among the tiers. */
Tiers.slideSteps = ((props) => maxStep(props.items)) satisfies StepCounter<TiersProps>;
