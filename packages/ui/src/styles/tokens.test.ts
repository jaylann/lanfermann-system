import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * The colour tokens carry their own proof: every text/ground pair a component may form is checked
 * against WCAG here, on all four grounds. Add a pair when a component starts using a new one.
 */

const GROUNDS = ["paper", "tint", "ink", "indigo"] as const;
type Ground = (typeof GROUNDS)[number];

function read(file: string) {
  return readFileSync(new URL(file, import.meta.url), "utf8").replaceAll(/\/\*[\s\S]*?\*\//g, "");
}

/** Resolves the `--lf-*` declarations that apply to one ground, later blocks winning. */
function tokensFor(ground: Ground, css: string) {
  const tokens = new Map<string, string>();
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selector || !body || selector.includes("@")) continue;
    const applies =
      selector.includes(`[data-theme="${ground}"]`) ||
      (ground === "paper" && selector.includes(":root")) ||
      (ground === "ink" && selector.includes(".dark"));
    if (!applies) continue;
    for (const [, name, value] of body.matchAll(/(--lf-[a-z-]+):\s*([^;]+);/g)) {
      if (name && value) tokens.set(name, value.trim());
    }
  }
  return tokens;
}

function luminance(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [value >> 16, (value >> 8) & 255, value & 255].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

const css = read("./grounds.css") + read("./status.css") + read("./code.css");

/** Every colour a highlighted span can take (code.css), and every face and wash it stands on. */
const codeRoles = [
  "text",
  "punct",
  "comment",
  "keyword",
  "string",
  "number",
  "function",
  "type",
  "tag",
  "attribute",
];
const codeFaces = ["code-face", "code-mark", "code-added", "code-removed"];
const byGround = Object.fromEntries(
  GROUNDS.map((ground) => [ground, tokensFor(ground, css)]),
) as Record<Ground, Map<string, string>>;

/** [foreground, background, minimum ratio] */
const TEXT = 4.5;
const pairs: [string, string, number][] = [
  ["text", "ground", TEXT],
  ["text-body", "ground", TEXT],
  ["text-muted", "ground", TEXT],
  ["text", "surface", TEXT],
  ["text-muted", "surface", TEXT],
  ["text", "surface-quiet", TEXT],
  ["text-muted", "surface-quiet", TEXT],
  ["text", "raised", TEXT],
  ["text", "raised-pressed", TEXT],
  ["text", "sheet", TEXT],
  ["text-muted", "sheet", TEXT],
  // Segment labels sit on the trough, card footers on the well.
  ["text", "trough", TEXT],
  ["text-muted", "trough", TEXT],
  ["text", "well", TEXT],
  ["text-muted", "well", TEXT],
  ["accent", "ground", TEXT],
  // A link stands on a card, its footer strip and a sheet as well, and it darkens on hover.
  ["accent", "surface", TEXT],
  ["accent", "well", TEXT],
  ["accent", "sheet", TEXT],
  ["accent-hover", "ground", TEXT],
  ["accent-pressed", "ground", TEXT],
  // A selected table row is washed in the tint.
  ["text", "tint", TEXT],
  ["text-body", "tint", TEXT],
  ["text-muted", "tint", TEXT],
  ["on-accent", "accent", TEXT],
  ["on-accent", "accent-hover", TEXT],
  ["on-accent", "accent-pressed", TEXT],
  ["on-key", "key", TEXT],
  ["on-key", "key-hover", TEXT],
  ["on-key", "key-pressed", TEXT],
  ["on-disabled", "disabled", TEXT],
  // The kit's structural line: 3:1, so a socket's rim is perceivable without its fill.
  ["line", "ground", 2.95],
  ...["danger", "warning", "success", "info"].flatMap((status): [string, string, number][] => [
    [status, "ground", TEXT],
    [status, "surface", TEXT],
    [status, `${status}-soft`, TEXT],
    [`on-${status}`, `${status}-solid`, TEXT],
  ]),
  // Code: each syntax colour on each face of a block and on each line wash. Line numbers are
  // the muted text on the block's face; the signs of a diff are the status text on its wash.
  ...codeRoles.flatMap((role) =>
    codeFaces.map((face): [string, string, number] => [`code-${role}`, face, TEXT]),
  ),
  ["text-muted", "code-mark", TEXT],
  // The header: the file name in the body colour, its symbol muted.
  ["text-body", "code-head", TEXT],
  ["text-muted", "code-head", TEXT],
  ["text-muted", "code-face", TEXT],
  ["success", "code-added", TEXT],
  ["danger", "code-removed", TEXT],
];

describe("ground tokens", () => {
  it("every ground defines the same set of tokens", () => {
    const names = (ground: Ground) => [...byGround[ground].keys()].sort();
    for (const ground of GROUNDS) expect(names(ground)).toEqual(names("paper"));
  });

  describe.each(GROUNDS)("contrast on %s", (ground) => {
    it.each(pairs)("%s on %s is at least %s:1", (foreground, background, minimum) => {
      const fg = byGround[ground].get(`--lf-${foreground}`);
      const bg = byGround[ground].get(`--lf-${background}`);
      expect(fg, `--lf-${foreground} on ${ground}`).toMatch(/^#[0-9a-f]{6}$/);
      expect(bg, `--lf-${background} on ${ground}`).toMatch(/^#[0-9a-f]{6}$/);
      expect(contrast(fg!, bg!)).toBeGreaterThanOrEqual(minimum);
    });
  });
});
