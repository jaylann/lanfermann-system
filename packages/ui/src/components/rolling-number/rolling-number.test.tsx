import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RollingNumber } from "./rolling-number";

describe("a rolling number whose value is no number", () => {
  it("writes it once instead of rendering without end", () => {
    // `NaN` is not equal to itself: compared with `!==` it was a new value on every render.
    const html = renderToString(<RollingNumber value={Number.NaN} />);
    expect(html).toContain("NaN");
  });

  it("writes a number in German, the plain text first", () => {
    const html = renderToString(<RollingNumber value={1234.5} />);
    expect(html).toContain("1.234,5");
    expect(html).not.toContain("rolling-number-column");
  });
});
