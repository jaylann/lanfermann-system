import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BarList } from "./bar-list";

/** The `--fill` of every bar, in the order the rows are drawn. */
const fills = (html: string) => [...html.matchAll(/--fill:([^;"]+)/g)].map((match) => match[1]);

describe("the bars of a list", () => {
  it("are as long as their share of the largest", () => {
    const html = renderToStaticMarkup(
      <BarList
        aria-label="Besuche"
        data={[
          { name: "Direkt", value: 50 },
          { name: "Suche", value: 200 },
        ]}
      />,
    );
    expect(fills(html)).toEqual(["1", "0.25"]);
  });

  it("keep their lengths beside a row whose value is no number", () => {
    const html = renderToStaticMarkup(
      <BarList
        aria-label="Besuche"
        share
        data={[
          { name: "Unbekannt", value: Number.NaN },
          { name: "Suche", value: 200 },
          { name: "Direkt", value: 50 },
        ]}
      />,
    );
    // The row without a number goes last, with an empty bar; the shares still add up.
    expect(fills(html)).toEqual(["1", "0.25", "0"]);
    expect(html).toContain("80 %");
    expect(html).toContain("20 %");
  });

  it("stand empty where nothing is above zero", () => {
    const html = renderToStaticMarkup(
      <BarList
        aria-label="Besuche"
        data={[
          { name: "Suche", value: 0 },
          { name: "Direkt", value: -3 },
        ]}
      />,
    );
    expect(fills(html)).toEqual(["0", "0"]);
  });
});
