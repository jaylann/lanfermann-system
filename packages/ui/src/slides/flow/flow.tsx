import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Icon } from "@/slides/icon/icon";
import type { IconGlyph } from "@/slides/icon/icons";

export type FlowProps = {
  /** Boxes in reading order. `icon` sets one of `ICONS` or `MARKS` before the title. `highlight` draws one box with the 2px accent edge. */
  nodes: Array<{ title: ReactNode; text?: ReactNode; icon?: IconGlyph; highlight?: boolean }>;
};

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
 */
export function Flow({ nodes }: FlowProps) {
  return (
    <div data-slot="slide-flow" className="flex items-center gap-4">
      {nodes.map((node, index) => {
        const title = (
          <h3 className="text-slide-body leading-[1.3] font-semibold text-fg">{node.title}</h3>
        );
        return (
          <Fragment key={index}>
            {index > 0 ? (
              <svg aria-hidden="true" width="48" height="24" viewBox="0 0 48 24" fill="none">
                <path d="M0 12H45M36 3l9 9-9 9" className="stroke-line" strokeWidth="2" />
              </svg>
            ) : null}
            <div
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
