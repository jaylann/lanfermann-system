import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Funnel } from "./funnel";

const fills = (html: string) => [...html.matchAll(/--fill:([^;"]+)/g)].map((match) => match[1]);

describe("the bars of a funnel", () => {
  it("are each step's share of the first, over the step before", () => {
    const html = renderToStaticMarkup(
      <Funnel
        aria-label="Angebote"
        data={[
          { name: "Geschrieben", value: 40 },
          { name: "Gesendet", value: 30 },
        ]}
      />,
    );
    // The first step, then the second's ghost (the first) and its own bar.
    expect(fills(html)).toEqual(["1", "1", "0.75"]);
  });

  it("fill the track and no more where a step is larger than the first", () => {
    // A fill of 1.5 is pushed half a track past the end, and leaves the track's start empty.
    const html = renderToStaticMarkup(
      <Funnel
        aria-label="Angebote"
        data={[
          { name: "Gesendet", value: 20 },
          { name: "Geöffnet", value: 30 },
          { name: "Angenommen", value: 10 },
        ]}
      />,
    );
    expect(fills(html)).toEqual(["1", "1", "1", "1", "0.5"]);
    expect(html).toContain("150 %");
  });

  it("are empty for a step whose value is no number", () => {
    const html = renderToStaticMarkup(
      <Funnel
        aria-label="Angebote"
        data={[
          { name: "Geschrieben", value: 40 },
          { name: "Gesendet", value: Number.NaN },
          { name: "Angenommen", value: 10 },
        ]}
      />,
    );
    expect(fills(html)).toEqual(["1", "1", "0", "0", "0.25"]);
  });

  it("stand empty where the first step is zero", () => {
    const html = renderToStaticMarkup(
      <Funnel
        aria-label="Angebote"
        data={[
          { name: "Geschrieben", value: 0 },
          { name: "Gesendet", value: 0 },
        ]}
      />,
    );
    expect(fills(html)).toEqual(["0", "0", "0"]);
  });
});
