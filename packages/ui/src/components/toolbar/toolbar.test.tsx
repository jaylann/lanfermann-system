import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toolbar, ToolbarButton } from "./toolbar";

afterEach(() => vi.restoreAllMocks());

describe("ToolbarButton", () => {
  it("hands its name, its class and what it holds to a control given as `render`", () => {
    const html = renderToString(
      <Toolbar aria-label="Ansicht">
        <ToolbarButton render={<button type="button" />} aria-label="Zoom" className="w-16">
          100 %
        </ToolbarButton>
      </Toolbar>,
    );
    expect(html).toContain('aria-label="Zoom"');
    expect(html).toMatch(/<button[^>]*class="[^"]*\bw-16\b/);
    expect(html).toContain("100 %");
  });

  it("keeps what only a `Button` reads away from that control", () => {
    const complaints = vi.spyOn(console, "error").mockImplementation(() => {});
    const html = renderToString(
      <Toolbar aria-label="Text formatieren">
        <ToolbarButton render={<button type="button" />} iconOnly aria-label="Fett" loading>
          F
        </ToolbarButton>
      </Toolbar>,
    );
    expect(html).toContain('aria-label="Fett"');
    // React complains about a prop it does not know on a DOM element (`iconOnly`, `loading`).
    expect(complaints).not.toHaveBeenCalled();
  });

  it("is a quiet, small `Button` without one, and keeps its own class", () => {
    const html = renderToString(
      <Toolbar aria-label="Ansicht">
        <ToolbarButton className="w-16">Zoom</ToolbarButton>
      </Toolbar>,
    );
    expect(html).toMatch(/<button[^>]*data-slot="toolbar-button"/);
    expect(html).toMatch(/<button[^>]*data-variant="quiet"/);
    expect(html).toMatch(/<button[^>]*class="[^"]*\bw-16\b/);
  });
});
