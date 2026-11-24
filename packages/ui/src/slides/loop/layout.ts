import type { ReactNode } from "react";

import type { DiagramCanvasEdge, DiagramCanvasNode } from "@/slides/diagram/diagram-canvas";
import type { Point } from "@/slides/diagram/geometry";
import { span } from "@/slides/lib/grid";

export type LoopStep = { title: ReactNode; highlight?: boolean; marker?: number };
export type LoopCenter = { label?: ReactNode; title?: ReactNode; text?: ReactNode };

export type LoopLayout = { nodes: DiagramCanvasNode[]; edges: DiagramCanvasEdge[] };

// How a number of steps stands around the rectangle: so many in the top and in the bottom row,
// so many between them on each side. Any other number is set on the ring of eight.
type Ring = readonly [perRow: number, perSide: number];
const RING_OF_EIGHT: Ring = [3, 1];
const RINGS: Record<number, Ring> = {
  4: [2, 0],
  6: [2, 1],
  8: RING_OF_EIGHT,
  10: [4, 1],
  12: [4, 2],
};

const STEP_HEIGHT = 80;
const CENTER_HEIGHT = 162;
/** The centre keeps this distance from the steps left and right of it. */
const CENTER_MARGIN = 32;

/**
 * The steps as the boxes and connectors of a diagram, clockwise around a rectangle from its top
 * left corner: the top row left to right, down the right side, the bottom row right to left, up
 * the left side, each joined to the next and the last to the first.
 *
 * The rows of the ring stand `rowGap` apart. A ring without steps on its sides (four steps)
 * keeps at least 226px between its two rows: the centre's 162px with 32px above and below. The
 * centre is text without a box, between the side columns and in the middle of the ring's height.
 *
 * @throws When there are more steps than the ring has places.
 */
export function loopLayout(
  steps: readonly LoopStep[],
  center: LoopCenter | undefined,
  cols: number,
  nodeSpan: number,
  rowGap: number,
): LoopLayout {
  const [perRow, perSide] = RINGS[steps.length] ?? RING_OF_EIGHT;
  const gap = perSide > 0 ? rowGap : Math.max(rowGap, CENTER_HEIGHT + 2 * CENTER_MARGIN);
  const width = span(cols);
  const stepWidth = span(nodeSpan);
  const rows = perSide + 2;
  const columnX = (column: number): number =>
    Math.round((column * (width - stepWidth)) / (perRow - 1));
  const rowY = (row: number): number => row * (STEP_HEIGHT + gap);

  const places: Point[] = [
    ...Array.from({ length: perRow }, (_, index): Point => [columnX(index), 0]),
    ...Array.from({ length: perSide }, (_, index): Point => [columnX(perRow - 1), rowY(index + 1)]),
    ...Array.from({ length: perRow }, (_, index): Point => [
      columnX(perRow - 1 - index),
      rowY(rows - 1),
    ]),
    ...Array.from({ length: perSide }, (_, index): Point => [0, rowY(perSide - index)]),
  ];

  const nodes = steps.map((step, index): DiagramCanvasNode => {
    const place = places[index];
    if (!place) {
      throw new Error("Loop: more steps than the ring has places. It takes 4, 6, 8, 10 or 12.");
    }
    return {
      id: `s${index}`,
      x: place[0],
      y: place[1],
      w: stepWidth,
      h: STEP_HEIGHT,
      title: step.title,
      center: true,
      tone: step.highlight ? "accent" : undefined,
      accent: step.highlight,
      marker: step.marker,
    };
  });

  if (center) {
    const ringHeight = rowY(rows - 1) + STEP_HEIGHT;
    nodes.push({
      id: "center",
      x: stepWidth + CENTER_MARGIN,
      y: Math.round((ringHeight - CENTER_HEIGHT) / 2),
      w: width - 2 * stepWidth - 2 * CENTER_MARGIN,
      h: CENTER_HEIGHT,
      tone: "none",
      center: true,
      dense: false,
      ...center,
    });
  }

  const edges = steps.map((_, index): DiagramCanvasEdge => ({
    from: `s${index}`,
    to: `s${(index + 1) % steps.length}`,
  }));

  return { nodes, edges };
}
