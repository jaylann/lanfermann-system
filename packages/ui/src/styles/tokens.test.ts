import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * The colour tokens carry their own proof: every text/ground pair a component may form is checked
 * against WCAG here, on all four grounds in both modes. Add a pair when a component starts using a
 * new one.
 */

const GROUNDS = ["paper", "tint", "ink", "indigo"] as const;
type Ground = (typeof GROUNDS)[number];
const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];
const SCOPES = MODES.flatMap((mode) => GROUNDS.map((ground) => ({ ground, mode })));
const label = ({ ground, mode }: { ground: Ground; mode: Mode }) =>
  mode === "light" ? ground : `${ground} (dark)`;

const DARK = '[data-mode="dark"]';
/** A region of a dark page that stays light: these parts repeat a light block inside it. */
const LIGHT_SCOPE = `${DARK} [data-mode="light"]`;
/** Dark Paper on a root that names no ground. */
const DARK_ROOT = `:root${DARK}:not([data-theme])`;

function read(file: string) {
  return readFileSync(new URL(file, import.meta.url), "utf8").replaceAll(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Whether one selector of a block's list sets a ground in a mode. A light block names the ground
 * (`:root` is Paper, `.dark` is Ink); a dark block names it under `[data-mode="dark"]`, and a
 * dark root that names no ground is Paper. Dark blocks are read on their own, not over the light
 * ones, so a token missing from a dark block fails the parity test instead of leaking the light
 * value.
 */
function setsScope(selector: string, ground: Ground, mode: Mode) {
  const part = selector.trim();
  // A light scope repeats a light block that is read already, and is no dark block.
  if (part.startsWith(LIGHT_SCOPE)) return false;
  if (part.includes(DARK) !== (mode === "dark")) return false;
  if (part.includes(`[data-theme="${ground}"]`)) return true;
  if (ground === "paper") return part === (mode === "dark" ? DARK_ROOT : ":root");
  return mode === "light" && ground === "ink" && part === ".dark";
}

/** Resolves the declarations with `prefix` that apply to one ground in one mode, later winning. */
function tokensFor(ground: Ground, mode: Mode, css: string, prefix = "--lf-") {
  const tokens = new Map<string, string>();
  const declaration = new RegExp(`(${prefix}[a-z0-9-]+):\\s*([^;]+);`, "g");
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selector || !body || selector.includes("@")) continue;
    if (!selector.split(",").some((part) => setsScope(part, ground, mode))) continue;
    for (const [, name, value] of body.matchAll(declaration)) {
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

const css = read("./grounds.css") + read("./status.css") + read("./code.css") + read("./chart.css");

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
const byScope = new Map(
  SCOPES.map((scope) => [label(scope), tokensFor(scope.ground, scope.mode, css)]),
);
const depthCss = read("./depth.css");

/** [foreground, background, minimum ratio] */
const TEXT = 4.5;
const MARK = 3;
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
  // Initials on an avatar's tile; the words on a Cta's block in the ask's and the key's tone.
  ["on-avatar", "avatar", TEXT],
  ["on-ask-block", "ask-block", TEXT],
  ["on-key-block", "key-block", TEXT],
  // The site's floor carries the footer's words; a calendar's chosen days are on-accent.
  ["text", "floor", TEXT],
  ["text-body", "floor", TEXT],
  ["text-muted", "floor", TEXT],
  ["on-accent", "selection", TEXT],
  // The kit's structural line: 3:1, so a socket's rim is perceivable without its fill.
  ["line", "ground", 2.95],
  ...["danger", "warning", "success", "info"].flatMap((status): [string, string, number][] => [
    [status, "ground", TEXT],
    [status, "surface", TEXT],
    [status, `${status}-soft`, TEXT],
    [`on-${status}`, `${status}-solid`, TEXT],
  ]),
  // A destructive row of a menu: the danger text on the sheet it lies on. Highlighted, it stands
  // on its wash, which the loop above already holds.
  ["danger", "sheet", TEXT],
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
  // Chart marks: a 2px line, a bar or a swatch must stand out from the ground and the card it
  // is drawn on (3:1, the mark contrast of WCAG 1.4.11). Their values are written in text.
  ...[1, 2, 3, 4, 5, 6].flatMap((series): [string, string, number][] => [
    [`series-${series}`, "ground", MARK],
    [`series-${series}`, "surface", MARK],
    [`on-series-${series}`, `series-${series}`, TEXT],
  ]),
];

describe("ground tokens", () => {
  it("every ground defines the same set of tokens in both modes", () => {
    const names = (scope: string) => [...(byScope.get(scope)?.keys() ?? [])].sort();
    for (const scope of byScope.keys()) expect(names(scope), scope).toEqual(names("paper"));
  });

  it("every ground and mode defines the same depth knobs", () => {
    const names = (ground: Ground, mode: Mode) =>
      [...tokensFor(ground, mode, depthCss, "--depth-").keys()].sort();
    const paper = names("paper", "light");
    expect(paper.length).toBeGreaterThan(0);
    for (const { ground, mode } of SCOPES)
      expect(names(ground, mode), label({ ground, mode })).toEqual(paper);
  });

  it("a dark block reaches its ground on <html> and nested in the page", () => {
    // Each ground on <html> itself and on a nested element; Paper also on a bare root.
    for (const [, selector] of (css + depthCss).matchAll(/([^{}]+)\{[^{}]*\}/g)) {
      if (!selector || selector.includes("@")) continue;
      const parts = selector
        .split(",")
        .map((part) => part.trim())
        .filter((part) => !part.startsWith(LIGHT_SCOPE));
      if (!parts.some((part) => part.includes(DARK))) continue;
      for (const ground of GROUNDS) {
        if (!parts.some((part) => part.includes(`[data-theme="${ground}"]`))) continue;
        expect(parts, selector).toContain(`${DARK}[data-theme="${ground}"]`);
        expect(parts, selector).toContain(`${DARK} [data-theme="${ground}"]`);
        if (ground === "paper") expect(parts, selector).toContain(DARK_ROOT);
      }
    }
  });

  it("a light block also reaches a light scope inside a dark page", () => {
    // Every block that sets a ground in light mode: on the scope itself and nested inside it.
    let blocks = 0;
    for (const [, selector] of (css + depthCss).matchAll(/([^{}]+)\{[^{}]*\}/g)) {
      if (!selector || selector.includes("@")) continue;
      const parts = selector.split(",").map((part) => part.trim());
      for (const ground of GROUNDS) {
        const plain = `[data-theme="${ground}"]`;
        if (!parts.includes(plain)) continue;
        blocks += 1;
        expect(parts, selector).toContain(`${LIGHT_SCOPE}${plain}`);
        expect(parts, selector).toContain(`${LIGHT_SCOPE} ${plain}`);
      }
    }
    expect(blocks).toBeGreaterThan(12);
  });

  describe.each([...byScope.keys()])("contrast on %s", (scope) => {
    const tokens = byScope.get(scope)!;
    it.each(pairs)("%s on %s is at least %s:1", (foreground, background, minimum) => {
      const fg = tokens.get(`--lf-${foreground}`);
      const bg = tokens.get(`--lf-${background}`);
      expect(fg, `--lf-${foreground} on ${scope}`).toMatch(/^#[0-9a-f]{6}$/);
      expect(bg, `--lf-${background} on ${scope}`).toMatch(/^#[0-9a-f]{6}$/);
      expect(contrast(fg!, bg!)).toBeGreaterThanOrEqual(minimum);
    });
  });
});
