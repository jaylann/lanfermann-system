import type { ReactNode } from "react";

import { DiagramCanvas } from "@/slides/diagram/diagram-canvas";
import { stepOf } from "@/slides/diagram/steps";
import { loopLayout } from "@/slides/loop/layout";
import type { StepCounter } from "@/slides/step/steps";

export type LoopProps = {
  /** An even number of steps, clockwise from the top left. Two or three words each. `highlight` marks the step where the loop is steered; `marker` ties a step to a finding beside the loop. `appearsAt` is the click of the slide at which the step arrives, with the connector of the ring that leads into it (the one that closes the ring comes with the last); without it the step is there from the start. */
  steps: Array<{ title: ReactNode; highlight?: boolean; marker?: number; appearsAt?: number }>;
  /** What one round is: a label, a sentence of two short lines, one muted line. `appearsAt` is the click at which it arrives; without it it is there from the start. */
  center?: { label?: ReactNode; title?: ReactNode; text?: ReactNode; appearsAt?: number };
  /** Width in grid columns: 8 by default, beside four columns of findings; 12 on its own. */
  cols?: number;
  /** Width of a step in grid columns, 2 by default. */
  nodeSpan?: number;
  /** Space between the rows in px, 64 by default. */
  rowGap?: number;
};

/**
 * Four to twelve steps that repeat, set around a rectangle, with what one round is in the middle.
 *
 * For a process that comes round again: measure, change, measure. A loop has no first step, so
 * the steps carry no numbers; the one that decides about the next round takes the accent. The
 * corners are right angles like every connector of the kit: no circle, no curved arrows. Who or
 * what drives the loop from outside is not drawn as another box with an arrow: mark the step it
 * acts on and say it in `Findings` beside the loop.
 *
 * Built up by clicks, the ring is told in the order it is walked, clockwise from where the talk
 * starts, with what one round is last or first; no more clicks than there are things to say.
 * The click is `appearsAt`, not `step`, because the loop's own steps already have that name.
 */
export function Loop({ steps, center, cols = 8, nodeSpan = 2, rowGap = 64 }: LoopProps) {
  const { nodes, edges } = loopLayout(steps, center, cols, nodeSpan, rowGap);
  return (
    <DiagramCanvas
      slot="slide-loop"
      cols={cols}
      dense
      nodes={nodes}
      edges={edges}
      alt={`Kreislauf aus ${steps.length} Schritten`}
    />
  );
}

// The ring's connectors name no step and come with the steps they join, so the highest step is
// among the steps of the loop and the centre.
Loop.slideSteps = ((props) =>
  Math.max(
    stepOf(props.center?.appearsAt),
    ...props.steps.map((step) => stepOf(step.appearsAt)),
  )) satisfies StepCounter<LoopProps>;
