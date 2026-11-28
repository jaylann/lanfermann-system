import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";

import { PriceTable, type PriceTableProps } from "./price-table";

const items: PriceTableProps["items"] = [
  { title: "Neue Website", price: "3.400,00 €" },
  { title: "Pflege und Hosting", price: "588,00 €", step: 1 },
];

describe("PriceTable by step", () => {
  it("marks a position on its row and a total on its pair", () => {
    const html = renderToStaticMarkup(
      <PriceTable
        items={items}
        totals={[
          ["Zwischensumme", "3.988,00 €"],
          ["Gesamt", "4.745,72 €", 2],
        ]}
      />,
    );
    expect(html).toContain('<tr data-slides-at="1" style="--step-at:1">');
    expect(html).toMatch(
      /<div class="[^"]*border-t-2[^"]*" data-slides-at="2" style="--step-at:2">/,
    );
    expect(html.match(/data-slides-at=/g)).toHaveLength(2);
  });

  it("counts the highest step among positions and totals", () => {
    expect(countSteps(<PriceTable items={[{ title: "Website", price: "1 €" }]} />)).toBe(0);
    expect(countSteps(<PriceTable items={items} />)).toBe(1);
    expect(countSteps(<PriceTable items={items} totals={[["Gesamt", "4.745,72 €", 3]]} />)).toBe(3);
  });
});
