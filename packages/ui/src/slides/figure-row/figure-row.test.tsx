import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BarList } from "@/slides/bar-list/bar-list";
import { Example } from "@/slides/example/example";
import { countSteps } from "@/slides/step/steps";

import { FigureRow } from "./figure-row";

describe("figures, bars and an example by step", () => {
  it("marks a figure with its rule, label and source", () => {
    const html = renderToStaticMarkup(
      <FigureRow
        items={[
          { value: "41", label: "der Anrufe" },
          { value: "3", label: "Tage", source: "Eigene Auswertung", step: 2 },
        ]}
      />,
    );
    expect(html).toContain(
      '<div class="flex flex-col gap-4 border-t-2 border-rule pt-6" data-step="2" style="--step-at:2">',
    );
    expect(html.match(/data-step=/g)).toHaveLength(1);
    expect(countSteps(<FigureRow items={[{ value: "1", label: "a", step: 3 }]} />)).toBe(3);
  });

  it("marks a row of bars and keeps its grid, the scale that of all rows", () => {
    const html = renderToStaticMarkup(
      <BarList
        width={1000}
        items={[
          { label: "Website", value: 50 },
          { label: "Google-Profil", value: 100, step: 1 },
        ]}
      />,
    );
    expect(html).toMatch(
      /<li class="[^"]*" data-step="1" style="--step-at:1;grid-template-columns:/,
    );
    // The unshown row still sets the full width: the other bar is half of its 264px track
    // (1000px less the 512px of labels, the 160px of values and the two 32px gaps).
    expect(html).toContain("width:132px");
    expect(BarList.slideSteps({ items: [{ label: "a", value: 1, step: 2 }] })).toBe(2);
  });

  it("brings an example's output and caption at its step, the input from the start", () => {
    const html = renderToStaticMarkup(
      <Example input="„Frage“" output="suchen()" caption="Modell" outputStep={1} />,
    );
    expect(html).toContain('<p data-lines="1" class="text-slide-lead text-fg">„Frage“</p>');
    expect(html).toContain('<div class="flex" data-step="1" style="--step-at:1">');
    expect(html).toContain('class="text-slide-meta text-fg-muted" data-step="1"');
    expect(Example.slideSteps({ input: "a", output: "b" })).toBe(0);
    expect(countSteps(<Example input="a" output="b" outputStep={2} />)).toBe(2);
  });
});
