import type { ReactNode } from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { cn } from "@/lib/cn";

/** What a card that is a choice says about itself. */
export type ChoiceCardText = {
  /** The choice, in a word or two: "Team", "Rechnungen schreiben". It names the control. */
  title: ReactNode;
  /** One sentence on what choosing it means. It describes the control. */
  description?: ReactNode;
  /** A second fact at the end of the first line, in tabular digits: a price, a number. */
  detail?: ReactNode;
  /** A 16px symbol before the title. Give every card of a group one or none. */
  icon?: IconSvgElement;
  /** More that belongs to the choice, under its sentence: a short list, a `Badge`. */
  children?: ReactNode;
};

/**
 * The card around a radio or a checkbox: a softly raised sheet that is the control's label, so
 * the whole of it is the target. It goes down under a press and seats back, takes the accent
 * outline when the keyboard is on its control, and lies flat when the control is disabled.
 * State is read from the control inside, which carries `data-slot="choice-control"`.
 */
export const choiceCard = [
  "group/card relative flex cursor-pointer items-start gap-3 rounded-xl bg-surface p-4 text-left depth-card select-none",
  // Only the press moves. The edge of the chosen card changes at once: the mark carries the
  // motion, and a shadow this large is not eased.
  "transition-[scale] spring-seat active:scale-(--motion-press-scale) active:spring-snap",
  // Under the pointer the ring of its mark darkens: the card says it can be taken.
  "hover:[--mark-ring:var(--lf-text-muted)]",
  "has-[[data-slot=choice-control]:focus-visible]:outline-2 has-[[data-slot=choice-control]:focus-visible]:outline-offset-2 has-[[data-slot=choice-control]:focus-visible]:outline-accent",
  "has-[[data-slot=choice-control][data-disabled]]:cursor-default has-[[data-slot=choice-control][data-disabled]]:bg-disabled has-[[data-slot=choice-control][data-disabled]]:depth-flat has-[[data-slot=choice-control][data-disabled]]:active:scale-100",
].join(" ");

/** The chosen card wears the accent as its edge. */
export const choiceCardEdge = "has-[[data-slot=choice-control][data-checked]]:depth-card-chosen";

/**
 * The control inside the card: a box of the check size on the title's first line. The card
 * around it takes the presses and shows the focus, so the control gives both up.
 */
export const choiceControl =
  "group/control pointer-events-none mt-0.5 flex size-(--check-size) shrink-0 items-center justify-center outline-hidden";

/** The system's mark for a card: an open ring that closes to the disc when it is chosen. */
export function ChoiceMark() {
  return (
    <span className="mark group-data-checked/control:mark-on group-data-disabled/control:[--mark-fill:var(--lf-on-disabled)] group-data-disabled/control:[--mark-ring:var(--lf-hairline)]" />
  );
}

type ChoiceCardBodyProps = ChoiceCardText & {
  /** The slot name of the card, for the parts' own slots: "radio-card". */
  slot: string;
  titleId: string;
  descriptionId: string;
};

/** The words of the card, beside its control. */
export function ChoiceCardBody({
  slot,
  titleId,
  descriptionId,
  title,
  description,
  detail,
  icon,
  children,
}: ChoiceCardBodyProps) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="flex items-baseline gap-3">
        <span
          id={titleId}
          data-slot={`${slot}-title`}
          className={cn(
            "flex min-w-0 items-center gap-2 text-control font-medium text-fg",
            "group-has-[[data-disabled]]/card:text-on-disabled",
          )}
        >
          {icon && <Icon icon={icon} size={16} className="shrink-0 text-fg-muted" />}
          {title}
        </span>
        {detail !== undefined && (
          <span
            data-slot={`${slot}-detail`}
            className="ml-auto shrink-0 text-control whitespace-nowrap text-fg-body tabular-nums group-has-[[data-disabled]]/card:text-on-disabled"
          >
            {detail}
          </span>
        )}
      </span>
      {description !== undefined && (
        <span
          id={descriptionId}
          data-slot={`${slot}-description`}
          className="text-sm text-pretty text-fg-muted group-has-[[data-disabled]]/card:text-on-disabled"
        >
          {description}
        </span>
      )}
      {children}
    </span>
  );
}
