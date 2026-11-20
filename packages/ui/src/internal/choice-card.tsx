import type { PointerEvent, ReactNode } from "react";

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
 * The card around a radio or a checkbox: a bevelled card (`depth-bevel`) that is the control's
 * label, so the whole of it is the target. It keeps its size and place. Under the pointer a soft
 * light follows the pointer across its face (`followPointer`); edge and shadow stay. Under a
 * press its shadow goes down to the page while its mark dips as a plain `Radio` or `Checkbox`
 * does. (The whole card going down to the press scale was too heavy: Justin, 2026-11-19. A wide
 * shadow rising under the pointer was "odd"; the light was chosen over a firmer edge and over a
 * 1px lift: Justin, 2026-11-20.) It takes the accent outline when the keyboard is on its
 * control, and lies flat when the control is disabled. State is read from the control inside,
 * which carries `data-slot="choice-control"`.
 */
export const choiceCard = [
  "group/card relative isolate flex cursor-pointer items-start gap-3 rounded-xl bg-surface p-4 text-left depth-bevel select-none",
  // Everything the card does is one shadow easing: it goes down fast under the press, and
  // comes back up while the accent edge of the choice arrives (`settle`), so the two read as
  // one move. What is given up leaves faster.
  "transition-[box-shadow] spring-leave not-active:has-[[data-slot=choice-control][data-checked]]:spring-settle active:spring-snap",
  "not-has-[[data-slot=choice-control][data-disabled]]:active:shadow-bevel-pressed",
  // The light: a layer under the words, where the pointer is (`--light-x`, `--light-y`), that
  // fades in under the pointer and out when it leaves. Not on a touch screen, which has no
  // pointer to follow, and not on a card that cannot be chosen.
  "before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:opacity-0",
  "before:bg-[radial-gradient(240px_circle_at_var(--light-x,50%)_var(--light-y,50%),var(--depth-bevel-light),transparent_70%)]",
  "before:transition-opacity before:spring-settle not-has-[[data-slot=choice-control][data-disabled]]:hover:before:opacity-100",
  "has-[[data-slot=choice-control]:focus-visible]:outline-2 has-[[data-slot=choice-control]:focus-visible]:outline-offset-2 has-[[data-slot=choice-control]:focus-visible]:outline-accent",
  "has-[[data-slot=choice-control][data-disabled]]:cursor-default has-[[data-slot=choice-control][data-disabled]]:bg-disabled has-[[data-slot=choice-control][data-disabled]]:depth-flat",
].join(" ");

/**
 * Where the pointer is on the card, for its light: written straight onto the card as two custom
 * properties, so a move never renders. Put it on the card as `onPointerMove`.
 */
export function followPointer(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
  const card = event.currentTarget;
  const box = card.getBoundingClientRect();
  card.style.setProperty("--light-x", `${event.clientX - box.left}px`);
  card.style.setProperty("--light-y", `${event.clientY - box.top}px`);
}

/** The chosen card wears the accent as its edge; it eases in on the card's own transition. */
export const choiceCardEdge = "has-[[data-slot=choice-control][data-checked]]:depth-bevel-chosen";

/**
 * The control inside the card: a box of the check size on the title's first line. The card
 * around it takes the presses and shows the focus, so the control gives both up; it dips
 * while the card is pressed, by as much as a plain `Radio` does under its own press.
 */
export const choiceControl = [
  "group/control pointer-events-none mt-0.5 flex size-(--check-size) shrink-0 items-center justify-center outline-hidden",
  "transition-[scale] spring-seat group-active/card:scale-[0.92] group-active/card:spring-snap",
  "data-disabled:scale-100",
].join(" ");

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
