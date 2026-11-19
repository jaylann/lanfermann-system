"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { useId } from "react";

import {
  choiceCard,
  ChoiceCardBody,
  choiceCardEdge,
  type ChoiceCardText,
  choiceControl,
  ChoiceMark,
} from "@/internal/choice-card";
import { cn } from "@/lib/cn";

export type RadioCardProps = Omit<
  RadioPrimitive.Root.Props,
  "children" | "className" | "render" | "title"
> &
  ChoiceCardText & {
    /**
     * How the chosen card shows it. `edge` (the default): the accent as its edge, and the mark
     * closed to a disc. `mark`: the mark alone, for a place where coloured edges would be too
     * much.
     */
    chosen?: "edge" | "mark";
    className?: string;
  };

/**
 * One choice out of a few whose options need a sentence each: a plan, an answer in a set-up.
 * The whole card is the control and the target. It is a softly raised sheet that stands still:
 * a press anywhere on it dips its mark. Chosen, it takes the accent as its edge and its mark
 * closes from ring to disc.
 *
 * Put the cards into a `RadioGroup` and lay them out with a class on it (`grid sm:grid-cols-3`
 * with `gap-3`). The title names the choice, the sentence says what it means; keep both the
 * same length from card to card. For options that are a word each, plain `Radio`s in rows are
 * calmer.
 */
export function RadioCard({
  title,
  description,
  detail,
  icon,
  chosen = "edge",
  className,
  children,
  ...props
}: RadioCardProps) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <label
      data-slot="radio-card"
      className={cn(choiceCard, chosen === "edge" && choiceCardEdge, className)}
    >
      <RadioPrimitive.Root
        data-slot="choice-control"
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        className={choiceControl}
        {...props}
      >
        <ChoiceMark />
      </RadioPrimitive.Root>
      <ChoiceCardBody
        slot="radio-card"
        titleId={titleId}
        descriptionId={descriptionId}
        title={title}
        description={description}
        detail={detail}
        icon={icon}
      >
        {children}
      </ChoiceCardBody>
    </label>
  );
}
