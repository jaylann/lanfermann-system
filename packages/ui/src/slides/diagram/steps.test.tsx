import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";

import { Diagram, type DiagramProps } from "./diagram";
import { diagramStepCount, drawOrder, edgeStep, edgeSteps, stepOf } from "./steps";

describe("stepOf", () => {
  it("reads a whole step from 1, and 0 for none", () => {
    expect(stepOf(3)).toBe(3);
    expect(stepOf(2.7)).toBe(2);
    expect(stepOf(undefined)).toBe(0);
    expect(stepOf(0)).toBe(0);
    expect(stepOf(-1)).toBe(0);
    expect(stepOf(Number.NaN)).toBe(0);
    expect(stepOf(Infinity)).toBe(0);
  });
});

describe("edgeStep", () => {
  it("comes with the later of its two boxes", () => {
    expect(edgeStep(undefined, 1, 3)).toBe(3);
    expect(edgeStep(undefined, 4, 2)).toBe(4);
    expect(edgeStep(undefined, undefined, 2)).toBe(2);
    expect(edgeStep(undefined, undefined, undefined)).toBe(0);
  });

  it("keeps a step of its own that is later, and moves an earlier one to its boxes", () => {
    expect(edgeStep(5, 1, 2)).toBe(5);
    expect(edgeStep(1, 2, 3)).toBe(3);
  });
});

describe("edgeSteps", () => {
  it("finds the boxes by id, or by index when a node has none", () => {
    expect(
      edgeSteps(
        [{ id: "a", step: 1 }, { id: "b", step: 2 }, { step: 3 }],
        [
          { from: "a", to: "b" },
          { from: "b", to: "2" },
          { from: "a", to: "b", step: 4 },
          { from: "a", to: "missing" },
        ],
      ),
    ).toEqual([2, 3, 4, 1]);
  });
});

describe("drawOrder", () => {
  it("counts the connectors of each step apart, in the order they are written", () => {
    expect(drawOrder([1, 2, 1, 0, 2, 1])).toEqual([0, 0, 1, 0, 1, 2]);
    expect(drawOrder([])).toEqual([]);
  });
});

describe("diagramStepCount", () => {
  it("is the highest step any box, connector or band names", () => {
    expect(diagramStepCount({})).toBe(0);
    expect(diagramStepCount({ nodes: [{ step: 2 }, {}], edges: [{}], bands: [{ step: 1 }] })).toBe(
      2,
    );
    expect(diagramStepCount({ nodes: [{ step: 2 }], edges: [{ step: 5 }] })).toBe(5);
    expect(diagramStepCount({ nodes: [{}], bands: [{ step: 3 }] })).toBe(3);
  });
});

type Node = DiagramProps["nodes"][number];
const anfrage: Node = { id: "anfrage", col: 1, row: 1, title: "Anfrage" };
const rueckruf: Node = { id: "rueckruf", col: 5, row: 1, title: "Rückruf", marker: 1 };
const termin: Node = { id: "termin", col: 9, row: 1, title: "Termin" };
const nodes = [anfrage, rueckruf, termin];

describe("Diagram by step", () => {
  it("draws a diagram without steps with no step attributes", () => {
    const html = renderToStaticMarkup(
      <Diagram
        nodes={nodes}
        edges={[{ from: "anfrage", to: "rueckruf", label: "am selben Tag" }]}
        bands={[{ col: 5, row: 1, span: 3 }]}
      />,
    );
    expect(html).not.toContain("data-step");
    expect(html).not.toContain("data-draw");
    expect(html).not.toContain("pathLength");
    expect(html).not.toContain("--step-at");
    expect(html).not.toContain("--draw-order");
    // The marker stays the disc itself, placed absolutely.
    expect(html).toContain('data-slot="slide-marker" class');
    expect(html).not.toContain("slide-diagram-marker");
  });

  it("marks boxes, markers, bands, connectors and labels with their steps", () => {
    const html = renderToStaticMarkup(
      <Diagram
        nodes={[anfrage, { ...rueckruf, step: 1 }, { ...termin, step: 2 }]}
        edges={[
          { from: "anfrage", to: "rueckruf", label: "am selben Tag" },
          { from: "anfrage", to: "termin", via: "below" },
          { from: "rueckruf", to: "termin", dashed: true },
        ]}
        bands={[{ col: 5, row: 1, span: 3, step: 1 }]}
      />,
    );
    expect(html).toContain('data-slot="slide-diagram-node" data-step="1"');
    expect(html).toContain('data-slot="slide-diagram-node" data-step="2"');
    expect(html).toContain('data-slot="slide-diagram-band" data-step="1"');
    expect(html).toContain('data-slot="slide-diagram-marker" data-step="1"');
    // The first connector draws at step 1; both others come at step 2, the second of them
    // dashed: it fades instead, and starts one place later.
    expect(html).toContain('data-slot="slide-diagram-edge" data-draw="" data-step="1"');
    expect(html).toContain(
      'data-slot="slide-diagram-edge" data-draw="" data-step="2" style="--step-at:2"',
    );
    expect(html).toContain(
      'data-slot="slide-diagram-edge" data-step="2" style="--step-at:2;--draw-order:1"',
    );
    expect(html.match(/pathLength="1"/g)).toHaveLength(2);
    expect(html).toContain('data-slot="slide-diagram-label" data-step="1"');
  });

  it("counts its steps without being drawn", () => {
    expect(Diagram.slideSteps({ nodes })).toBe(0);
    expect(
      countSteps(
        <Diagram
          nodes={[{ ...anfrage, step: 2 }, termin]}
          edges={[{ from: "anfrage", to: "termin", step: 3 }]}
        />,
      ),
    ).toBe(3);
  });
});
