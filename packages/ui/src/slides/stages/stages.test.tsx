import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";

import { stagesLayout } from "./layout";
import { Stages, type StagesProps } from "./stages";

const items: StagesProps["items"] = [
  { title: "Anfrage" },
  { title: "Rückruf", step: 1 },
  { title: "Angebot", step: 2 },
];

describe("Stages by step", () => {
  it("hands the steps of stages and paths back to the canvas", () => {
    const { nodes, edges } = stagesLayout(items, [true, null], [{ from: 3, to: 2, step: 3 }]);
    expect(nodes.map((node) => node.step)).toEqual([undefined, 1, 2]);
    // The connectors between stages name none: the canvas brings each with its later stage.
    expect(edges.map((edge) => edge.step)).toEqual([undefined, undefined, 3]);
  });

  it("brings the connector into a stage, and its checkpoint, with that stage", () => {
    const html = renderToStaticMarkup(<Stages items={items} gates={["G1", true]} />);
    expect(html).toContain('data-slot="slide-diagram-edge" data-draw="" data-slides-at="1"');
    expect(html).toContain('data-slot="slide-diagram-edge" data-draw="" data-slides-at="2"');
    expect(html).toContain('data-slot="slide-diagram-gate-label" data-slides-at="1"');
    expect(html.match(/data-slot="slide-diagram-gate"/g)).toHaveLength(2);
  });

  it("lets a path back fade, not draw", () => {
    const html = renderToStaticMarkup(
      <Stages items={items} returns={[{ from: 3, to: 2, label: "Rückfrage" }]} />,
    );
    // It comes with the later of its stages, the third, and starts after the connector into it.
    expect(html).toContain(
      'data-slot="slide-diagram-edge" data-slides-at="2" style="--step-at:2;--draw-order:1"',
    );
  });

  it("counts the stages and the paths back", () => {
    expect(Stages.slideSteps({ items: [{ title: "Anfrage" }] })).toBe(0);
    expect(Stages.slideSteps({ items })).toBe(2);
    expect(countSteps(<Stages items={items} returns={[{ from: 3, to: 2, step: 4 }]} />)).toBe(4);
  });
});
