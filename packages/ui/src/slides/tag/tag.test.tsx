import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";

import { Tag, Tags } from "./tag";

describe("Tags by step", () => {
  it("draws a plain tag as before", () => {
    expect(renderToStaticMarkup(<Tag>Schreinerei</Tag>)).toBe(
      '<p data-slot="slide-tag" class="rounded-[2px] border border-line px-4 py-2 text-slide-meta text-fg">Schreinerei</p>',
    );
  });

  it("marks a tag written with a step and leaves words and elements as they are", () => {
    const html = renderToStaticMarkup(
      <Tags items={["Anfahrt", <em key="e">Preise</em>, { label: "Bewertungen", step: 2 }]} />,
    );
    expect(html).toContain('text-fg">Anfahrt</p>');
    expect(html).toContain('text-fg"><em>Preise</em></p>');
    expect(html).toContain('text-fg" data-slides-at="2" style="--step-at:2">Bewertungen</p>');
    expect(html.match(/data-slides-at=/g)).toHaveLength(1);
  });

  it("counts the steps of tags written with one", () => {
    expect(Tags.slideSteps({ items: ["Anfahrt", "Preise"] })).toBe(0);
    expect(
      countSteps(<Tags items={["Anfahrt", { label: "Preise", step: 3 }, { label: "Zeiten" }]} />),
    ).toBe(3);
  });
});
