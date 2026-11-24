import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { countSteps } from "@/slides/step/steps";

import { Code } from "./code";

const LISTING = ["[", "  eins,", "  zwei,", "  drei", "]"].join("\n");

/** The `data-step` of every line, in order; `null` for a line there from the start. */
function lineSteps(html: string): (string | null)[] {
  const block = /<div class="flex flex-col rounded[^"]*">(.*?)<\/div>/.exec(html)?.[1] ?? "";
  return [...block.matchAll(/<p([^>]*)>/g)].map(
    ([, attributes = ""]) => /data-step="(\d+)"/.exec(attributes)?.[1] ?? null,
  );
}

describe("Code by step", () => {
  it("marks no line without reveal", () => {
    const html = renderToStaticMarkup(<Code code={LISTING} />);
    expect(html).not.toContain("data-step");
    expect(Code.slideSteps({ code: LISTING })).toBe(0);
  });

  it("marks the lines of each entry, counted from 1 with `to` inclusive", () => {
    const html = renderToStaticMarkup(
      <Code
        code={LISTING}
        reveal={[
          { from: 2, to: 3, step: 1 },
          { from: 4, step: 2 },
        ]}
      />,
    );
    expect(lineSteps(html)).toEqual([null, "1", "1", "2", null]);
    expect(html).toContain('style="--step-at:2"');
  });

  it("gives a line named twice the later entry", () => {
    const html = renderToStaticMarkup(
      <Code
        code={LISTING}
        reveal={[
          { from: 2, to: 4, step: 1 },
          { from: 3, step: 3 },
        ]}
      />,
    );
    expect(lineSteps(html)).toEqual([null, "1", "3", "1", null]);
  });

  it("keeps the accent line with a step", () => {
    const html = renderToStaticMarkup(
      <Code code={LISTING} highlight={1} reveal={[{ from: 2, step: 1 }]} />,
    );
    expect(html).toMatch(/<p class="[^"]*text-accent" data-step="1"/);
  });

  it("counts the highest step in reveal", () => {
    const reveal = [
      { from: 2, step: 3 },
      { from: 3, step: 1 },
    ];
    expect(Code.slideSteps({ code: LISTING, reveal })).toBe(3);
    expect(countSteps(<Code code={LISTING} reveal={reveal} />)).toBe(3);
  });
});
