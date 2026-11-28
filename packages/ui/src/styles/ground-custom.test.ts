import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A ground in a brand's own colours derives its text from two colours by mixing them. The mixes
 * are read from the stylesheet and worked out here, as the browser does it (in Oklab), for a few
 * pairs a brand may bring: the text they give must hold WCAG's contrast on the ground.
 */

const css = readFileSync(new URL("./ground-custom.css", import.meta.url), "utf8").replaceAll(
  /\/\*[\s\S]*?\*\//g,
  "",
);

type Rgb = [number, number, number];

const rgbOf = (hex: string): Rgb => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [value >> 16, (value >> 8) & 255, value & 255].map((c) => c / 255) as Rgb;
};
const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function toOklab(rgb: Rgb): Rgb {
  const [r, g, b] = rgb.map(linear) as Rgb;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.min(1, Math.max(0, gamma(c)))) as Rgb;
}

/** `color-mix(in oklab, a share%, b)`. */
function mix(a: Rgb, b: Rgb, share: number): Rgb {
  const [x, y] = [toOklab(a), toOklab(b)];
  return fromOklab(x.map((value, index) => value * share + y[index]! * (1 - share)) as Rgb);
}

const luminance = (rgb: Rgb) => {
  const [r, g, b] = rgb.map(linear) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: Rgb, b: Rgb) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
};

type Scheme = "light" | "dark";

const MIX =
  /color-mix\(in oklab, (white|var\(--ground-ink\)) (\d+)%, var\(--ground-background\)\)/g;

/**
 * A token of the stylesheet worked out for one pair: mixed from the ground with the text colour
 * or with white, by the share the stylesheet names. A token that differs by the room's light
 * (`light-dark(a, b)`) has two mixes, the light one first.
 */
function tokenOf(token: string, ground: Rgb, ink: Rgb, scheme: Scheme): Rgb {
  const value = new RegExp(`${token}:([^;]+);`).exec(css)?.[1];
  const mixes = [...(value ?? "").matchAll(MIX)];
  const found = mixes.length === 2 ? mixes[scheme === "light" ? 0 : 1] : mixes[0];
  if (!found?.[1] || !found[2]) throw new Error(`${token} is not mixed from the ground's colours`);
  return mix(found[1] === "white" ? [1, 1, 1] : ink, ground, Number(found[2]) / 100);
}

/** Background and foreground, as a brand may bring them: at least 7:1 apart. */
const PAIRS: [name: string, background: string, foreground: string, scheme: Scheme][] = [
  ["white under deep blue", "#ffffff", "#0b2a6b", "light"],
  ["deep blue under white", "#0b2a6b", "#ffffff", "dark"],
  ["cream under brown", "#fbf3e4", "#3b2613", "light"],
  ["forest under cream", "#143d2b", "#f4efe1", "dark"],
  ["the kit's own Paper", "#fbfbfd", "#13121c", "light"],
  ["the kit's own Ink", "#13121c", "#fbfbfd", "dark"],
  ["black on a signal yellow", "#ffd400", "#111111", "light"],
];

describe("a ground in a brand's own colours", () => {
  it.each(PAIRS)("%s: the pair itself is far enough apart", (_name, background, foreground) => {
    expect(contrast(rgbOf(background), rgbOf(foreground))).toBeGreaterThanOrEqual(7);
  });

  it.each(PAIRS)("%s: muted text holds 4.5:1", (_name, background, foreground, scheme) => {
    const [ground, ink] = [rgbOf(background), rgbOf(foreground)];
    const muted = tokenOf("--lf-text-muted", ground, ink, scheme);
    expect(contrast(muted, ground)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(PAIRS)(
    "%s: muted text holds 4.5:1 on a surface too",
    (_name, background, foreground, scheme) => {
      const [ground, ink] = [rgbOf(background), rgbOf(foreground)];
      const muted = tokenOf("--lf-text-muted", ground, ink, scheme);
      for (const face of ["--lf-surface", "--lf-surface-quiet", "--lf-raised", "--lf-sheet"]) {
        expect(contrast(muted, tokenOf(face, ground, ink, scheme))).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it.each(PAIRS)("%s: body text holds 7:1", (_name, background, foreground, scheme) => {
    const [ground, ink] = [rgbOf(background), rgbOf(foreground)];
    const body = tokenOf("--lf-text-body", ground, ink, scheme);
    expect(contrast(body, ground)).toBeGreaterThanOrEqual(7);
  });

  it.each(PAIRS)(
    "%s: a line, the edge of a control, holds 3:1",
    (_name, background, foreground, scheme) => {
      const [ground, ink] = [rgbOf(background), rgbOf(foreground)];
      const line = tokenOf("--lf-line", ground, ink, scheme);
      expect(contrast(line, ground)).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(PAIRS)(
    "%s: text on a disabled part holds 4.5:1",
    (_name, background, foreground, scheme) => {
      const [ground, ink] = [rgbOf(background), rgbOf(foreground)];
      const face = tokenOf("--lf-disabled", ground, ink, scheme);
      const text = tokenOf("--lf-on-disabled", ground, ink, scheme);
      expect(contrast(text, face)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("outranks every ground block, also a light scope inside a dark page", () => {
    const selector = /^\s*((?:\[data-ground-custom\])+)\s*\{/m.exec(css)?.[1] ?? "";
    // `[data-mode="dark"] [data-mode="light"][data-theme="paper"]` is three attributes.
    expect(selector.match(/\[data-ground-custom\]/g)?.length ?? 0).toBeGreaterThan(3);
  });

  it("names every colour of a ground's first ten, so nothing of the kit's ground shows through", () => {
    for (const token of [
      "ground",
      "text",
      "text-body",
      "text-muted",
      "line",
      "rule",
      "accent",
      "on-accent",
      "surface",
      "surface-quiet",
    ]) {
      expect(css).toMatch(new RegExp(`--lf-${token}:`));
    }
  });
});
