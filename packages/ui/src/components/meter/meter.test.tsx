import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Meter, MeterLabel, MeterValue } from "./meter";

describe("a meter rendered on a server", () => {
  it("writes its value in German whatever language the server runs in", () => {
    // Base UI formats in the runtime's language: "24%" here, "24 %" in a German browser, which
    // is a hydration mismatch in the text and in `aria-valuetext`.
    const html = renderToString(
      <Meter value={24}>
        <MeterLabel>Speicher</MeterLabel>
        <MeterValue />
      </Meter>,
    );
    expect(html).toContain('aria-valuetext="24 %"');
    expect(html).toContain(">24 %<");
  });

  it("writes in the caller's language where one is given", () => {
    const html = renderToString(<Meter value={24} locale="en-US" aria-label="Storage" />);
    expect(html).toContain('aria-valuetext="24%"');
  });

  it("stands empty for a value that is no number", () => {
    const html = renderToString(<Meter value={Number.NaN} aria-label="Speicher" />);
    expect(html).toContain("--fill:0");
  });
});
