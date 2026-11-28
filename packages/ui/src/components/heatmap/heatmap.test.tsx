import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Heatmap } from "./heatmap";

describe("a heatmap's days", () => {
  it("count a value that is no number as a missing one", () => {
    const html = renderToString(
      <Heatmap
        label="Angebote pro Tag"
        unit={{ one: "Angebot", other: "Angebote" }}
        data={[
          { date: "2026-11-16", value: 3 },
          { date: "2026-11-17", value: Number.NaN },
          { date: "2026-11-18", value: 1 },
        ]}
      />,
    );
    expect(html).not.toContain("NaN");
    // React marks where one piece of text ends and the next begins.
    const text = html.replaceAll("<!-- -->", "");
    expect(text).toContain("17. Nov. 2026: 0 Angebote<");
    expect(text).toContain("18. Nov. 2026: 1 Angebot<");
  });

  it("is an empty grid without days, and no tab stop", () => {
    // It drew one day, 1 January 1970, with a tab stop and a line in the list.
    const html = renderToString(<Heatmap label="Angebote pro Tag" data={[]} />);
    expect(html).not.toContain("data-index");
    expect(html).not.toContain("tabindex");
    expect(html).not.toContain("1970");
    expect(html).not.toContain("<li>");
  });

  it("shows the days from `start` to `end` where the data has none", () => {
    const html = renderToString(
      <Heatmap label="Angebote pro Tag" data={[]} start="2026-11-16" end="2026-11-18" />,
    );
    expect(html.match(/data-index/g)).toHaveLength(3);
  });
});
