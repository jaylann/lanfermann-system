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

/** One style rule of a stylesheet: its selector, the at-rules around it, its declarations. */
type Rule = { selector: string; within: string[]; declarations: [string, string][] };

/** The style rules of a stylesheet without comments, with the at-rules they stand in. */
function rules(css: string): Rule[] {
  const found: Rule[] = [];
  const open: { prelude: string; at: number }[] = [];
  let start = 0;
  for (let index = 0; index < css.length; index++) {
    const char = css[index];
    if (char === "{") {
      open.push({ prelude: (css.slice(start, index).split(";").pop() ?? "").trim(), at: index });
      start = index + 1;
    } else if (char === "}") {
      const block = open.pop();
      if (block && !block.prelude.startsWith("@")) {
        const declarations = css
          .slice(block.at + 1, index)
          .split(";")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part): [string, string] => {
            const colon = part.indexOf(":");
            return [part.slice(0, colon).trim(), part.slice(colon + 1).trim()];
          });
        found.push({
          selector: block.prelude.replaceAll(/\s+/g, " "),
          within: open.map((outer) => outer.prelude.replaceAll(/\s+/g, " ")),
          declarations,
        });
      }
      start = index + 1;
    } else if (char === ";" && open.length === 0) {
      start = index + 1;
    }
  }
  return found;
}

/** The selectors of a list, split at the commas that are not inside parentheses. */
function selectorsOf(list: string): string[] {
  const selectors: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of list) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      selectors.push(current.trim());
      current = "";
    } else current += char;
  }
  return [...selectors, current.trim()];
}

const MOVING = /^(transition|animation)/;
const REDUCED = "@media screen and (prefers-reduced-motion: reduce)";

describe("steps and motion", () => {
  const all = rules(slides);
  const value = (rule: Rule | undefined, property: string) =>
    rule?.declarations.find(([name]) => name === property)?.[1];

  it("a step is shown or hidden by one rule that needs no live slide", () => {
    const reveal = all.find(
      (rule) =>
        rule.selector === '[data-slot="slide"] [data-step]' &&
        rule.within.join() === "@layer components",
    );
    expect(value(reveal, "--step-on")).toBe(
      "clamp(0, calc(var(--slide-step, 9999) - var(--step-at, 0) + 1), 1)",
    );
    expect(value(reveal, "opacity")).toBe("var(--step-on)");
    expect(value(reveal, "translate")).toBe("0 calc((1 - var(--step-on)) * 16px)");
    expect(reveal?.declarations.map(([name]) => name)).not.toContain("display");
  });

  it("a rule about steps names a slide or one of its parts", () => {
    // `data-step` and `data-draw` are plain names. A page may use them for something of its
    // own (the workshop's stories do), and this stylesheet is loaded beside it.
    const marked = all.filter((rule) => /\[data-(step|draw)\]/.test(rule.selector));
    expect(marked.length).toBeGreaterThan(0);
    for (const rule of marked)
      for (const selector of selectorsOf(rule.selector))
        expect(selector, rule.selector).toMatch(/\[data-slot="slide[-"]/);
  });

  it("everything that moves is live, on a screen, and has a reduced-motion answer", () => {
    const moving = all.filter((rule) => rule.declarations.some(([name]) => MOVING.test(name)));
    expect(moving.length).toBeGreaterThan(0);
    for (const rule of moving) {
      for (const selector of selectorsOf(rule.selector))
        expect(selector, rule.selector).toContain("[data-slides-live]");
      expect(rule.within.at(-1), rule.selector).toMatch(
        /^@media screen and \(prefers-reduced-motion: (no-preference|reduce)\)$/,
      );
    }
  });

  it("only translate, scale and opacity move, timed by the slide's custom properties", () => {
    for (const rule of all) {
      if (rule.within.some((at) => at.startsWith("@keyframes"))) {
        for (const [name] of rule.declarations)
          expect(["opacity", "translate", "scale"]).toContain(name);
      }
      for (const [name, text] of rule.declarations) {
        if (!MOVING.test(name)) continue;
        expect(text, `${name} in ${rule.selector}`).not.toMatch(/\d(m?s)\b/);
        if (name === "transition") {
          // `stroke-dashoffset` is how a connector draws itself; `none` switches a fade off.
          for (const part of text.split(","))
            expect(["opacity", "translate", "stroke-dashoffset", "none"]).toContain(
              part.trim().split(/\s+/)[0],
            );
        }
      }
    }
    const slide = all.find(
      (rule) => rule.selector === '[data-slot="slide"]' && rule.within.join() === "@layer base",
    );
    for (const name of [
      "--slide-ease",
      "--slide-step-duration",
      "--slide-enter-duration",
      "--slide-enter-stagger",
      "--slide-forms-duration",
      "--slide-forms-stagger",
    ])
      expect(value(slide, name), name).toBeDefined();
  });

  it("the entrance leaves out the footer row, the forms, steps and a scene", () => {
    const entrance = all.find(
      (rule) =>
        rule.within.at(-1) !== REDUCED && value(rule, "animation")?.startsWith("slide-rise"),
    );
    for (const slot of ["slide-footer", "slide-forms", "slide-scene"])
      expect(entrance?.selector).toContain(`[data-slot="${slot}"]`);
    expect(entrance?.selector).toContain("[data-step]");
    expect(entrance?.selector).toContain(':not([data-motion="none"])');
  });

  it("under reduced motion nothing travels and nothing grows", () => {
    const reduced = all.filter((rule) => rule.within.at(-1) === REDUCED);
    expect(reduced.length).toBeGreaterThan(0);
    const keyframes = (name: string) =>
      all.filter((rule) => rule.within.at(-1) === `@keyframes ${name}`);
    for (const rule of reduced) {
      for (const [name, text] of rule.declarations) {
        if (name === "translate" || name === "scale") expect(text).toBe("none");
        if (name === "transition") expect(text).not.toMatch(/translate|scale/);
        if (name === "animation") {
          const frames = keyframes(text.split(" ")[0] ?? "");
          expect(frames.length).toBeGreaterThan(0);
          for (const frame of frames)
            expect(frame.declarations.map(([property]) => property)).toEqual(["opacity"]);
        }
      }
    }
  });

  it("every animation names keyframes the stylesheet defines", () => {
    for (const rule of all) {
      const animation = value(rule, "animation");
      if (animation === undefined) continue;
      const name = animation.split(" ")[0];
      expect(slides, rule.selector).toContain(`@keyframes ${name} {`);
    }
  });

  it("a print shows every step", () => {
    const print = all.find(
      (rule) =>
        rule.selector === '[data-slot="slide"] [data-step]' &&
        rule.within.at(-1) === "@media print",
    );
    expect(value(print, "--step-on")).toBe("1");
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
