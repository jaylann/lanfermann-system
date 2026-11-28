import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Bullet } from "./bullet";

const fills = (html: string) => [...html.matchAll(/--fill:([^;"]+)/g)].map((match) => match[1]);

describe("the bar of a goal", () => {
  it("stands at the value's share of the scale", () => {
    const html = renderToStaticMarkup(
      <Bullet aria-label="Ziele" data={[{ name: "Umsatz", value: 50, target: 80, max: 100 }]} />,
    );
    expect(fills(html)).toEqual(["0.5"]);
  });

  it("is empty for a value that is no number, on the scale of the goal", () => {
    // `--fill: NaN` is no length: the fill then stood unmoved, a full bar.
    const html = renderToStaticMarkup(
      <Bullet
        aria-label="Ziele"
        data={[{ name: "Umsatz", value: Number.NaN, target: 80, bands: [40, 60] }]}
      />,
    );
    expect(fills(html)).toEqual(["0"]);
    expect(html).not.toMatch(/translate:[^;"]*NaN/);
    expect(html).not.toMatch(/clip-path:[^;"]*NaN/);
    // The goal keeps its place on a scale that ends at 100, not at the scale's end.
    expect(html).toContain("translate:-20% 0%");
  });

  it("does not divide by a goal of zero", () => {
    const html = renderToStaticMarkup(
      <Bullet aria-label="Ziele" data={[{ name: "Umsatz", value: 5, target: 0 }]} />,
    );
    expect(html).not.toContain("vom Ziel");
  });
});
