import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(import.meta.dirname, file), "utf8");

const numbers = (css: string, pattern: RegExp) =>
  pattern
    .exec(css)![1]!
    .split(",")
    .map((part) => Number(part.trim()));

describe("chart", () => {
  it("follows a pointer on the slider's chase", () => {
    expect(numbers(read("chart.css"), /--chart-chase:\s*cubic-bezier\(([^)]+)\)/)).toEqual(
      numbers(read("slider.css"), /--slider-chase:\s*cubic-bezier\(([^)]+)\)/),
    );
  });

  it("gives every ground the six series and the muted grey", () => {
    const css = read("chart.css");
    // The ground blocks, not the `@theme` aliases that read them.
    const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*--lf-series[^{}]*)\}/g)].filter(
      ([, selector]) => !selector!.includes("@theme"),
    );
    expect(blocks).toHaveLength(3);
    for (const [, , body] of blocks) {
      for (const name of ["1", "2", "3", "4", "5", "6", "muted"]) {
        expect(body).toMatch(new RegExp(`--lf-series-${name}:\\s*#[0-9a-f]{6};`));
      }
    }
  });
});
