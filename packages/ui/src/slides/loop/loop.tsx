import type { ReactNode } from "react";

import { DiagramCanvas } from "@/slides/diagram/diagram-canvas";
import { loopLayout } from "@/slides/loop/layout";

export type LoopProps = {
  /** An even number of steps, clockwise from the top left. Two or three words each. `highlight` marks the step where the loop is steered; `marker` ties a step to a finding beside the loop. */
  steps: Array<{ title: ReactNode; highlight?: boolean; marker?: number }>;
  /** What one round is: a label, a sentence of two short lines, one muted line. */
  center?: { label?: ReactNode; title?: ReactNode; text?: ReactNode };
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
