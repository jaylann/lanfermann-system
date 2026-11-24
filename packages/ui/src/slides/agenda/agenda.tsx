import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

export type AgendaProps = {
  /** Part title and page number. Five parts at most. An optional third entry is the step the part appears at, with its line (`["Was eine neue Seite kostet", 15, 2]`); without it the part is there from the start. */
  items: Array<[ReactNode, ReactNode, number?]>;
  /** Index of the part that starts now. The others step back into `text-muted`. */
  current?: number;
};

/**
 * The parts of a deck, each with the page it starts on.
 *
 * Only for decks of fifteen slides or more. Each row starts with a 32px disc, one per part, the
 * same discs that stand in the top left corner of a section opener. With `current`, the parts up
 * to the current one are filled and the coming ones are open rings. The numbers are page numbers,
 * the one case where a list carries numerals without being a sequence of steps: they point at
 * something. Part titles are sentences or noun phrases in sentence case, without a full stop.
 * An agenda is an overview and stands whole; bring its parts in one by one only when each gets a
 * sentence of its own before the next.
 */
export function Agenda({ items, current }: AgendaProps) {
  return (
    <ol data-slot="slide-agenda" className="flex flex-col">
      {items.map(([title, page, step], index) => {
        const aside = current != null && current !== index;
        const coming = current != null && index > current;
        return (
          <li
            key={index}
            className="flex items-center gap-8 border-t border-line py-6 first:border-t-2 first:border-rule"
            {...stepAttributes(step)}
          >
            <div
              className={cn(
                "size-8 shrink-0 rounded-full",
                coming ? "border-2 border-accent" : "bg-accent",
              )}
            />
            <p className={cn("w-[1344px] text-slide-lead", aside ? "text-fg-muted" : "text-fg")}>
              {title}
            </p>
            <p className="slide-span-2 text-right text-slide-lead text-fg-muted tabular-nums">
              {page}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** The highest step among the parts (the third entry of each). */
Agenda.slideSteps = ((props) =>
  maxStep(props.items.map(([, , step]) => ({ step })))) satisfies StepCounter<AgendaProps>;
