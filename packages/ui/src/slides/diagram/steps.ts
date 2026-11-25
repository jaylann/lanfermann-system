/**
 * When the parts of a diagram appear, for a diagram built up step by step. No React and no DOM:
 * the canvas marks its boxes and connectors with the numbers worked out here, and the static
 * `slideSteps` of `Diagram`, `Stages`, `Loop` and `Flow` count them.
 *
 * A box, a band and a connector may each name a step. A connector never appears before the two
 * boxes it joins: without a step of its own it comes with the later of them, and a step of its
 * own that is earlier is moved to theirs. So the highest step of a diagram is always the highest
 * step any part names, and it can be counted without finding a connector's boxes.
 */
import { maxStep } from "@/slides/step/steps";

/** A step as `stepAttributes` reads it: a whole number from 1, or 0 for "there from the start". */
export function stepOf(at: number | undefined): number {
  return at !== undefined && Number.isFinite(at) && at > 0 ? Math.trunc(at) : 0;
}

/** The step a connector appears at: its own, or the later of its two boxes, whichever is later. */
export function edgeStep(
  own: number | undefined,
  from: number | undefined,
  to: number | undefined,
): number {
  return Math.max(stepOf(own), stepOf(from), stepOf(to));
}

/**
 * The step of every connector, in the edges' order. An edge finds its boxes by node `id` (a node
 * without one answers to its index, as in `diagramLayout`); a box that is not there counts as
 * shown from the start, since the layout refuses such an edge anyway.
 */
export function edgeSteps(
  nodes: ReadonlyArray<{ id?: string; step?: number }>,
  edges: ReadonlyArray<{ from: string; to: string; step?: number }>,
): number[] {
  const byId = new Map<string, number | undefined>();
  nodes.forEach((node, index) => byId.set(node.id ?? String(index), node.step));
  return edges.map((edge) => edgeStep(edge.step, byId.get(edge.from), byId.get(edge.to)));
}

/**
 * The order in which the connectors of one step draw, from 0: the order they are written in,
 * counted apart for every step. A path is told in the order it is walked, so the edges of a
 * step are written that way too. A connector without a step gets 0.
 */
export function drawOrder(steps: readonly number[]): number[] {
  const seen = new Map<number, number>();
  return steps.map((step) => {
    if (step <= 0) return 0;
    const order = seen.get(step) ?? 0;
    seen.set(step, order + 1);
    return order;
  });
}

/** How many steps the parts of a diagram ask for: the highest step any of them names. */
export function diagramStepCount({
  nodes,
  edges,
  bands,
}: {
  nodes?: ReadonlyArray<{ step?: number }>;
  edges?: ReadonlyArray<{ step?: number }>;
  bands?: ReadonlyArray<{ step?: number }>;
}): number {
  return Math.max(maxStep(nodes), maxStep(edges), maxStep(bands));
}
