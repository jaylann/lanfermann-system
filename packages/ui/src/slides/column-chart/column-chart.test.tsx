import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";

import { ColumnChart } from "./column-chart";

describe("ColumnChart by step", () => {
  it("marks nothing without a step", () => {
    const html = renderToStaticMarkup(
      <ColumnChart
        items={[
          { label: "Mai", value: 4 },
          { label: "Juni", value: 5 },
        ]}
      />,
    );
    expect(html).not.toContain("data-slides-at");
  });

  it("marks a column's item, which holds its value and label, and not the list's baseline", () => {
    const html = renderToStaticMarkup(
      <ColumnChart
        items={[
          { label: "Mai", value: 4 },
          { label: "Juni", value: 5, step: 2 },
        ]}
      />,
    );
    expect(html).toMatch(/<ol data-slot="slide-column-chart" class="[^"]*before:bg-rule"/);
    expect(html).toContain('<li class="row-[1/4] grid grid-rows-subgrid" data-slides-at="2"');
    expect(html.match(/data-slides-at=/g)).toHaveLength(1);
  });

  it("brings a group's name and columns at its step, a column never before its group", () => {
    const html = renderToStaticMarkup(
      <ColumnChart
        groups={[
          {
            label: "Desktop",
            step: 2,
            items: [
              { label: "vorher", value: 9 },
              { label: "nachher", value: 11, step: 3 },
              { label: "früher", value: 3, step: 1 },
            ],
          },
        ]}
      />,
    );
    expect(html).toMatch(/<p class="pt-4[^"]*" data-slides-at="2"[^>]*>Desktop<\/p>/);
    expect(html.match(/<li class="row-\[1\/4\][^"]*" data-slides-at="(\d)"/g)).toEqual([
      '<li class="row-[1/4] grid grid-rows-subgrid" data-slides-at="2"',
      '<li class="row-[1/4] grid grid-rows-subgrid" data-slides-at="3"',
      '<li class="row-[1/4] grid grid-rows-subgrid" data-slides-at="2"',
    ]);
    // The group's own item and its run keep the baseline in view.
    expect(html).toContain('<li class="flex flex-col-reverse justify-end">');
    expect(html).toMatch(/<ol class="[^"]*before:bg-rule"/);
  });

  it("counts columns, groups and the columns in groups", () => {
    expect(ColumnChart.slideSteps({ items: [{ label: "Mai", value: 4, step: 2 }] })).toBe(2);
    expect(
      ColumnChart.slideSteps({
        groups: [
          { label: "A", step: 4, items: [{ label: "vorher", value: 1 }] },
          { label: "B", items: [{ label: "vorher", value: 1, step: 5 }] },
        ],
      }),
    ).toBe(5);
    expect(
      countSteps(
        <ColumnChart groups={[{ label: "A", step: 4, items: [{ label: "vorher", value: 1 }] }]} />,
      ),
    ).toBe(4);
    expect(ColumnChart.slideSteps({ items: [{ label: "Mai", value: 4 }] })).toBe(0);
  });
});
