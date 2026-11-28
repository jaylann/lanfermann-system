import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Progress, ProgressLabel, ProgressValue } from "./progress";

describe("a progress bar rendered on a server", () => {
  it("writes its value in German whatever language the server runs in", () => {
    const html = renderToString(
      <Progress value={40}>
        <ProgressLabel>Export</ProgressLabel>
        <ProgressValue />
      </Progress>,
    );
    expect(html).toContain('aria-valuetext="40 %"');
    expect(html).toContain(">40 %<");
  });

  it("writes in the caller's language where one is given", () => {
    const html = renderToString(<Progress value={40} locale="en-US" aria-label="Export" />);
    expect(html).toContain('aria-valuetext="40%"');
  });

  it("runs with an open end for a value that is no number, as Base UI reports it", () => {
    const html = renderToString(<Progress value={Number.NaN} aria-label="Export" />);
    expect(html).toContain("data-indeterminate");
    // No place of its own: the fill is the part that runs through, not a full bar.
    expect(html).not.toContain("--fill:");
  });
});
