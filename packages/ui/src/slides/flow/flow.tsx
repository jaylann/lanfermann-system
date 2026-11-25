import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { edgeStep } from "@/slides/diagram/steps";
import { Icon } from "@/slides/icon/icon";
import type { IconGlyph } from "@/slides/icon/icons";
import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

export type FlowProps = {
  /** Boxes in reading order. `icon` sets one of `ICONS` or `MARKS` before the title. `highlight` draws one box with the 2px accent edge. `step` is the click at which the box arrives, with the arrow that leads into it; without one it is there from the start. */
  nodes: Array<{
    title: ReactNode;
    text?: ReactNode;
    icon?: IconGlyph;
    highlight?: boolean;
    step?: number;
  }>;
};

/** The arrow between two boxes, 48 by 24. */
const ARROW = { width: 48, height: 24, line: "M0 12H45", head: "M36 3l9 9-9 9" } as const;

/**
 * The arrow into a box. Without a step it is one path, as it always was. At a step the line and
 * its head are two paths, so that `slides.css` can draw the line (`pathLength="1"`) and bring
 * the head in after it, the way a connector of `Diagram` arrives.
 */
function FlowArrow({ step }: { step: number }) {
  const box = {
    "aria-hidden": true,
    width: ARROW.width,
    height: ARROW.height,
    viewBox: `0 0 ${ARROW.width} ${ARROW.height}`,
    fill: "none",
  } as const;
  if (step <= 0) {
    return (
      <svg data-slot="slide-flow-arrow" {...box}>
        <path d={`${ARROW.line}${ARROW.head}`} className="stroke-line" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg data-slot="slide-flow-arrow" data-draw="" {...stepAttributes(step)} {...box}>
      <path
        data-slot="slide-flow-line"
        d={ARROW.line}
        pathLength={1}
        className="stroke-line"
        strokeWidth="2"
      />
      <path data-slot="slide-flow-head" d={ARROW.head} className="stroke-line" strokeWidth="2" />
    </svg>
  );
}

/**
 * Three to five boxes joined by arrows, one of them highlighted.
 *
 * The look every diagram in a deck follows, whatever its shape. Nodes are boxes on `surface` with
 * a 1px `line` edge and `radius-4`; text inside at 32px strong and 24px muted, 32px padding.
 * Connectors are 2px lines in `line` with an open arrowhead, straight or with one right angle,
 * never curved, never crossing a box. One node may carry the 2px `accent` edge: the one the title
 * is about. Different kinds of node differ by a label inside, not by fill colour or shape. For a
 * plain row of steps; a process with checkpoints or return paths is `Stages`, one that repeats is
 * `Loop`, and anything that is not a row is `Diagram`.
 *
 * Built up by steps, the row is told in the order it is walked, left to right, one box a click
 * at most; the arrow into a box draws itself as the box arrives.
 */
export function Flow({ nodes }: FlowProps) {
  return (
    <div data-slot="slide-flow" className="flex items-center gap-4">
      {nodes.map((node, index) => {
        const title = (
          <h3 className="text-slide-body leading-[1.3] font-semibold text-fg">{node.title}</h3>
        );
        const step = stepAttributes(node.step);
        return (
          <Fragment key={index}>
            {index > 0 ? (
              <FlowArrow step={edgeStep(undefined, nodes[index - 1]?.step, node.step)} />
            ) : null}
            <div
              data-slot="slide-flow-node"
              {...step}
              className={cn(
                "flex flex-1 flex-col gap-2 self-stretch rounded-[4px] bg-surface p-8",
                node.highlight ? "border-2 border-accent" : "border border-line",
              )}
            >
              {node.icon ? (
                <div className="flex items-center gap-3">
                  <Icon icon={node.icon} size={32} />
                  {title}
                </div>
              ) : (
                title
              )}
              {node.text != null ? (
                <p className="text-slide-meta text-fg-muted">{node.text}</p>
              ) : null}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

Flow.slideSteps = ((props) => maxStep(props.nodes)) satisfies StepCounter<FlowProps>;
