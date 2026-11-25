import type { ReactNode } from "react";

import type { DiagramCanvasEdge, DiagramCanvasNode } from "@/slides/diagram/diagram-canvas";
import type { IconGlyph } from "@/slides/icon/icons";
import { SLIDE_GUTTER, span } from "@/slides/lib/grid";

export type Stage = {
  title: ReactNode;
  text?: ReactNode;
  label?: ReactNode;
  icon?: IconGlyph;
  highlight?: boolean;
  marker?: number;
  lines?: number;
  step?: number;
};

export type StageReturn = { from: number; to: number; label?: ReactNode; step?: number };

export type StagesLayout = {
  /** Five and six stages are set small: titles at 24px. */
  dense: boolean;
  nodes: DiagramCanvasNode[];
  edges: DiagramCanvasEdge[];
};

/**
 * The stages as the boxes and connectors of a diagram: equal boxes across the twelve columns, a
 * connector from each to the next (with its checkpoint), and every return path under the row,
 * dashed, in the accent.
 *
 * A box is as wide as twelve columns divide into (a whole number of px, the last box ending on
 * the right margin) and, unless `height` says otherwise, as high as its label, its title and the
 * longest text need: 31px a line, over 145px of label, title and padding (118px when dense).
 *
 * A return path enters its stage 32px from the left edge. When that stage itself sends a path
 * back, the two would meet there: the arriving path then enters 32px from the right edge and
 * carries its label on the line under the row.
 *
 * Steps: a stage's box and marker come at its `step`. The connector into a stage, with its
 * checkpoint, names no step, so the canvas brings it with the later of its two stages: with the
 * stage it leads into, when the stages are told in order. A return path comes at its own `step`,
 * or likewise with the later of its two stages.
 */
export function stagesLayout(
  items: readonly Stage[],
  gates: ReadonlyArray<string | boolean | null>,
  returns: readonly StageReturn[],
  height?: number,
): StagesLayout {
  const count = items.length;
  const width = Math.floor((span(12) - (count - 1) * SLIDE_GUTTER) / count);
  const dense = count > 4;
  const lines = Math.max(...items.map((item) => item.lines ?? 2));
  const boxHeight = height ?? (dense ? 110 + lines * 31 : 137 + lines * 31) + 8;
  const returning = new Set(returns.map((path) => path.from));

  const nodes = items.map((item, index): DiagramCanvasNode => ({
    id: String(index + 1),
    x: index === count - 1 ? span(12) - width : index * (width + SLIDE_GUTTER),
    y: 0,
    w: width,
    h: boxHeight,
    label: item.label ?? String(index + 1),
    title: item.title,
    text: item.text,
    tone: item.highlight ? "accent" : undefined,
    marker: item.marker,
    icon: item.icon,
    step: item.step,
  }));

  const edges: DiagramCanvasEdge[] = [
    ...items.slice(1).map((_, index) => ({
      from: String(index + 1),
      to: String(index + 2),
      gate: gates[index] ?? undefined,
    })),
    ...returns.map((path): DiagramCanvasEdge => {
      const meetsReturn = returning.has(path.to);
      return {
        from: String(path.from),
        to: String(path.to),
        via: "below",
        dashed: true,
        accent: true,
        label: path.label,
        toX: meetsReturn ? width - 32 : 32,
        labelAt: meetsReturn ? "bus" : undefined,
        labelWidth: width - 48 + (meetsReturn ? SLIDE_GUTTER : 0),
        step: path.step,
      };
    }),
  ];

  return { dense, nodes, edges };
}
