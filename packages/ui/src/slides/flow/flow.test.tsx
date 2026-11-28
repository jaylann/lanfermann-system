import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";

import { Flow } from "./flow";

describe("Flow by step", () => {
  it("keeps the arrow one path when nothing comes at a step", () => {
    const html = renderToStaticMarkup(<Flow nodes={[{ title: "Anfrage" }, { title: "Termin" }]} />);
    expect(html).toContain('d="M0 12H45M36 3l9 9-9 9"');
    expect(html).not.toContain("data-slides-at");
    expect(html).not.toContain("pathLength");
  });

  it("brings a box and the arrow into it at the box's step", () => {
    const html = renderToStaticMarkup(
      <Flow nodes={[{ title: "Anfrage" }, { title: "Rückruf", step: 1 }, { title: "Termin" }]} />,
    );
    expect(html).toContain('data-slot="slide-flow-node" data-slides-at="1"');
    // The arrow into the second box and the one out of it both come with it.
    expect(
      html.match(/data-slot="slide-flow-arrow" data-draw="" data-slides-at="1"/g),
    ).toHaveLength(2);
    expect(html).toContain('data-slot="slide-flow-line" d="M0 12H45" pathLength="1"');
    expect(html).toContain('data-slot="slide-flow-head" d="M36 3l9 9-9 9"');
  });

  it("counts its boxes' steps", () => {
    expect(Flow.slideSteps({ nodes: [{ title: "Anfrage" }] })).toBe(0);
    expect(
      countSteps(
        <Flow
          nodes={[
            { title: "Anfrage", step: 2 },
            { title: "Termin", step: 3 },
          ]}
        />,
      ),
    ).toBe(3);
  });
});
