import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(import.meta.dirname, file), "utf8");

/** The declarations of every rule whose selector matches, as `name: value` lines. */
function blocks(css: string, selector: RegExp) {
  const found: string[][] = [];
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selector.test(match[1]!.trim())) continue;
    found.push(
      match[2]!
        .split(";")
        .map((line) => line.replace(/\/\*.*?\*\//g, "").trim())
        .filter(Boolean)
        .map((line) => line.replace(/\s*:\s*/, ": ")),
    );
  }
  return found;
}

describe("touch", () => {
  const touch = read("touch.css");

  it("draws the same 44px target for a real touch pointer and a forced one", () => {
    const targets = blocks(touch, /::after$/);
    expect(targets).toHaveLength(2);
    expect(targets[0]).toEqual(targets[1]);
    expect(targets[0]).toContain("width: max(100%, 2.75rem)");
    expect(targets[0]).toContain("height: max(100%, 2.75rem)");
  });

  it("leaves the control sizes alone: a touch pointer does not change the density", () => {
    expect(touch).not.toMatch(/--control-(sm|md|lg)\s*:/);
    expect(read("density.css")).not.toMatch(/pointer:\s*coarse/);
  });
});
