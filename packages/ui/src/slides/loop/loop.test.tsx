import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { edgeSteps } from "@/slides/diagram/steps";
import { countSteps } from "@/slides/step/steps";

import { loopLayout } from "./layout";
import { Loop, type LoopProps } from "./loop";

const steps: LoopProps["steps"] = [
  { title: "Messen", appearsAt: 1 },
  { title: "Auswerten", appearsAt: 2 },
  { title: "Ändern", appearsAt: 3 },
  { title: "Prüfen", appearsAt: 4 },
];

describe("Loop by step", () => {
  it("brings the connector into a step with it, and the one that closes the ring last", () => {
    const { nodes, edges } = loopLayout(steps, { title: "Ein Monat", appearsAt: 5 }, 8, 2, 64);
    expect(nodes.map((node) => node.step)).toEqual([1, 2, 3, 4, 5]);
    // The centre's click stays out of the text it hands on.
    expect(nodes[4]).not.toHaveProperty("appearsAt");
    expect(edgeSteps(nodes, edges)).toEqual([2, 3, 4, 4]);
  });

  it("draws the ring's connectors", () => {
    const html = renderToStaticMarkup(<Loop steps={steps} />);
    expect(html.match(/data-draw=""/g)).toHaveLength(4);
    // The last two both come at the fourth click: the closing one starts after the other.
    expect(html).toContain("--step-at:4;--draw-order:1");
  });

  it("counts the steps of the loop and the centre", () => {
    expect(Loop.slideSteps({ steps: [{ title: "Messen" }, { title: "Prüfen" }] })).toBe(0);
    expect(Loop.slideSteps({ steps })).toBe(4);
    expect(countSteps(<Loop steps={steps} center={{ title: "Ein Monat", appearsAt: 6 }} />)).toBe(
      6,
    );
  });
});
