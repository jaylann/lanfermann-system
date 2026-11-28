import { cloneElement, type CSSProperties, isValidElement, type ReactNode } from "react";

import { stepAttributes, type StepCounter } from "@/slides/step/steps";

export type StepProps = {
  /**
   * The step it appears at, counted from 1. Until then it keeps its place and cannot be seen.
   * Several blocks may share a step; they appear together.
   */
  at: number;
  /**
   * What appears. One plain element (`<p>`, `<div>`, …) is marked itself, so the layout stays as
   * it is; anything else (text, several children, a part) is wrapped in a block of its own.
   */
  children: ReactNode;
};

/** A plain element that can carry the step itself: a tag name, not a component. */
type Markable = { style?: CSSProperties; "data-slides-at"?: number };

/**
 * Marks a block of a slide to appear at a step, when the presenter clicks.
 *
 * For a slide that builds an argument: the observation stands, the consequence appears on the
 * next click, the conclusion on the one after. Three steps a slide at most, as a rule of thumb;
 * what needs more is two slides. A part with steps of its own (columns, rows, a diagram) takes
 * them in its props and needs no `Step`; this one is for your own markup and for parts without.
 *
 * What appears keeps its place: it is there from the start, only invisible, so nothing around
 * it moves when it shows. Never hide a slide's whole content behind clicks for suspense: the title and
 * the evidence the title is about stand from the start, and only what the presenter says in
 * turn is held back. A print, a preview and the check show every step at once, so the slide has
 * to read well with all of them shown.
 *
 * A block that is placed absolutely is marked one by one (each `Step` around one element):
 * a wrapped block becomes the frame its absolute children are placed in.
 */
export function Step({ at, children }: StepProps) {
  const step = stepAttributes(at);
  if (isValidElement<Markable>(children) && typeof children.type === "string") {
    if (step["data-slides-at"] === undefined) return children;
    return cloneElement(children, {
      "data-slides-at": step["data-slides-at"],
      style: { ...children.props.style, ...step.style },
    });
  }
  return (
    <div data-slot="slide-step" {...step}>
      {children}
    </div>
  );
}

/** The steps a `Step` asks for, read without drawing it (see `countSteps`). */
Step.slideSteps = ((props) => props.at) satisfies StepCounter<StepProps>;
