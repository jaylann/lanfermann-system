import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { cn, slideTextNames } from "@/lib/cn";

/**
 * A slide has grounds of its own (slides.css), so that dark mode cannot reach it. They are the
 * kit's ten colours per ground, the same ten the light blocks of grounds.css start with: this
 * keeps the two copies together.
 */

function read(file: string) {
  return readFileSync(new URL(file, import.meta.url), "utf8").replaceAll(/\/\*[\s\S]*?\*\//g, "");
}

const KIT_TOKENS = [
  "--lf-ground",
  "--lf-text",
  "--lf-text-body",
  "--lf-text-muted",
  "--lf-line",
  "--lf-rule",
  "--lf-accent",
  "--lf-on-accent",
  "--lf-surface",
  "--lf-surface-quiet",
];

/** The first selector of each ground's light block in grounds.css. */
const LIGHT_BLOCK = {
  paper: ":root",
  tint: '[data-theme="tint"]',
  ink: ".dark",
  indigo: '[data-theme="indigo"]',
} as const;

function declarations(body: string) {
  const tokens = new Map<string, string>();
  for (const [, name, value] of body.matchAll(/(--lf-[a-z0-9-]+):\s*([^;]+);/g)) {
    if (name && value) tokens.set(name, value.trim());
  }
  return tokens;
}

/** The declarations of the first block whose selector list starts with `selector`. */
function block(css: string, selector: string) {
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors?.split(",")[0]?.trim() === selector && body) return declarations(body);
  }
  throw new Error(`no block for ${selector}`);
}

const slides = read("./slides.css");
const grounds = read("./grounds.css");

describe("slide grounds", () => {
  for (const [ground, selector] of Object.entries(LIGHT_BLOCK)) {
    it(`${ground} holds the kit's ten colours, as grounds.css has them in light mode`, () => {
      const slide = block(slides, `[data-slide-ground="${ground}"]`);
      const light = block(grounds, selector);
      expect([...slide.keys()]).toEqual(KIT_TOKENS);
      for (const token of KIT_TOKENS) expect(slide.get(token)).toBe(light.get(token));
    });
  }

  it("no rule of the slide stylesheet depends on the mode or on a page ground", () => {
    expect(slides).not.toMatch(/data-mode|data-theme/);
  });
});

describe("slide type", () => {
  it("every size of slides.css is registered for tailwind-merge, and no other", () => {
    const sizes = [...slides.matchAll(/--text-slide-([a-z]+):/g)].map(([, name]) => name);
    expect(sizes.sort()).toEqual([...slideTextNames].sort());
  });

  it("a slide size and a text colour are kept side by side", () => {
    expect(cn("text-slide-title text-fg")).toBe("text-slide-title text-fg");
    expect(cn("text-slide-body", "text-slide-lead")).toBe("text-slide-lead");
  });
});

describe("class name sources", () => {
  /** The folders of `src` that hold compiled code, by where their classes are registered. */
  const folders = readdirSync(new URL("..", import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "styles")
    .map((entry) => entry.name);

  it("styles.css registers every folder of the library but the slide parts", () => {
    const [, list] = /@source "\.\.\/dist\/\{([^}]+)\}";/.exec(read("../styles.css")) ?? [];
    expect(list?.split(",").sort()).toEqual(folders.filter((name) => name !== "slides").sort());
  });

  it("slides.css registers the slide parts", () => {
    expect(slides).toContain('@source "../../dist/slides";');
  });
});
