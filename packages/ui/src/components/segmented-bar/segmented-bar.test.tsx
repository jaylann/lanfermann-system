import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SegmentedBar } from "./segmented-bar";

describe("the parts of a segmented bar", () => {
  it("keep their shares beside a part whose value is no number", () => {
    const html = renderToStaticMarkup(
      <SegmentedBar
        label="Rechnungen nach Stand"
        data={[
          { name: "Bezahlt", value: 75 },
          { name: "Unbekannt", value: Number.NaN },
          { name: "Offen", value: 25 },
        ]}
      />,
    );
    // One `NaN` made the sum `NaN`, every share nothing and the bar empty.
    expect(html).toContain("Bezahlt 75 %");
    expect(html).toContain("Offen 25 %");
    expect(html.match(/clip-path:inset/g)).toHaveLength(2);
    expect(html).not.toContain("NaN%");
  });

  it("draw nothing, and divide by nothing, where the whole is zero", () => {
    const html = renderToStaticMarkup(
      <SegmentedBar label="Rechnungen nach Stand" data={[{ name: "Offen", value: 0 }]} />,
    );
    expect(html).not.toContain("clip-path");
    expect(html).toContain("Offen 0 %");
  });
});
