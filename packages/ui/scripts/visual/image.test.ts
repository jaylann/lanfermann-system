import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import { BASELINE_GROUNDS, PLAYWRIGHT_IMAGE, PLAYWRIGHT_IMAGE_TAG } from "./image.ts";

const require = createRequire(import.meta.url);

describe("the container the baseline is drawn in", () => {
  it("carries the browsers of the installed Playwright", () => {
    const installed = (
      JSON.parse(readFileSync(require.resolve("playwright/package.json"), "utf8")) as {
        version: string;
      }
    ).version;
    // A Playwright bump has to move the image along, and then the baseline.
    expect(PLAYWRIGHT_IMAGE_TAG).toBe(`v${installed}-noble`);
  });

  it("is pinned by digest, not only by tag", () => {
    expect(PLAYWRIGHT_IMAGE).toMatch(
      /^mcr\.microsoft\.com\/playwright:v[\d.]+-noble@sha256:[0-9a-f]{64}$/,
    );
  });

  it("covers the grounds that have a depth recipe of their own", () => {
    expect(BASELINE_GROUNDS.split(",")).toEqual(["paper", "ink", "indigo"]);
  });
});
