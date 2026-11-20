"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { useId } from "react";

import {
  choiceCard,
  ChoiceCardBody,
  choiceCardEdge,
  type ChoiceCardText,
  choiceControl,
  followPointer,
} from "@/internal/choice-card";
import { TickGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

export type CheckboxCardProps = Omit<
  CheckboxPrimitive.Root.Props,
  "children" | "className" | "render" | "title" | "indeterminate" | "parent"
> &
  ChoiceCardText & {
    /**
     * How the chosen card shows it. `edge` (the default): the accent as its edge, with its
     * mark. `mark`: the mark alone.
     */
    chosen?: "edge" | "mark";
    className?: string;
  };

/**
 * One of several things that may each be chosen, where every option needs a sentence: what a
 * workspace is for, which notices to get. The whole card is the control and the target, cut
 * like a `RadioCard`: a softly raised sheet that stands still while its box dips under a press,
 * and takes the accent as its edge when it is on.
 *
 * Put the cards into a `CheckboxGroup` (its value is the list of the chosen `value`s) and lay
 * them out with a class on it. A single card on its own is a setting with an explanation; a
 * `Switch` with a label is usually the better form for that.
 */
export function CheckboxCard({
  title,
  description,
  detail,
  icon,
  chosen = "edge",
  className,
  children,
  ...props
}: CheckboxCardProps) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <label
      data-slot="checkbox-card"
      onPointerMove={followPointer}
      className={cn(choiceCard, chosen === "edge" && choiceCardEdge, className)}
    >
      <CheckboxPrimitive.Root
        data-slot="choice-control"
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        className={cn(
          choiceControl,
          // The checkbox's socket and plug (checkbox.tsx); the press comes from the card.
          "rounded-xs bg-surface text-on-accent depth-socket transition-[box-shadow,background-color,scale]",
          "data-checked:bg-accent data-checked:depth-plug data-checked:depth-tone-accent",
          "data-disabled:bg-disabled data-disabled:depth-flat data-disabled:text-on-disabled",
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          keepMounted
          data-slot="checkbox-card-indicator"
          className="flex items-center justify-center"
        >
          {/* The tick draws in (short leg first) and simply fades out: an exit never performs. */}
          <TickGlyph className="opacity-0 transition-[stroke-dashoffset,opacity] duration-150 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] group-data-checked/control:opacity-100 group-data-checked/control:[stroke-dashoffset:0]" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <ChoiceCardBody
        slot="checkbox-card"
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
