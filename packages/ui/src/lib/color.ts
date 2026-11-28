/**
 * Colour as `#rrggbb`, and how well two colours read on each other: what a `ColorField` checks
 * and what decides whether the tick on a `ColorSwatch` is dark or light. The contrast is WCAG
 * 2's: relative luminance in linear sRGB, and `(lighter + 0.05) / (darker + 0.05)`.
 *
 * Server-safe and pure. Every function that takes a colour takes it as `#rrggbb` or `#rgb`.
 */

const HEX = /^#?(?:([0-9a-f]{3})|([0-9a-f]{6}))$/i;

/**
 * Reads a typed colour: `#5B4FCF`, `5b4fcf`, `#abc`. Returns it as lower-case `#rrggbb`, or
 * nothing when the text is no such colour. Alpha (`#rrggbbaa`) and names are not read.
 */
export function parseHexColor(text: string): string | undefined {
  const match = HEX.exec(text.trim());
  if (!match) return undefined;
  const [, short, long] = match;
  const digits = short === undefined ? long : short.replace(/./g, "$&$&");
  return digits === undefined ? undefined : `#${digits.toLowerCase()}`;
}

/** One sRGB channel (0 to 255) as linear light. */
function linear(channel: number): number {
  const share = channel / 255;
  return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
}

/**
 * How light a colour is to the eye, from 0 (black) to 1 (white): WCAG's relative luminance.
 * Nothing for text that is no hex colour.
 */
export function relativeLuminance(color: string): number | undefined {
  const hex = parseHexColor(color);
  if (hex === undefined) return undefined;
  const red = linear(Number.parseInt(hex.slice(1, 3), 16));
  const green = linear(Number.parseInt(hex.slice(3, 5), 16));
  const blue = linear(Number.parseInt(hex.slice(5, 7), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * The WCAG contrast ratio of two colours, from 1 (the same) to 21 (black on white). The order
 * does not matter. Nothing when one of them is no hex colour.
 */
export function contrastRatio(one: string, other: string): number | undefined {
  const a = relativeLuminance(one);
  const b = relativeLuminance(other);
  if (a === undefined || b === undefined) return undefined;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** What WCAG AA asks of body text against its background. */
export const TEXT_CONTRAST = 4.5;

/**
 * A ratio cut to one decimal, never rounded up: 4.47 is shown as 4.4, so a number on screen
 * never claims a contrast the colours do not have.
 */
export function floorContrast(ratio: number): number {
  return Math.floor(ratio * 10 + 1e-9) / 10;
}

/** Whether a colour is light or dark to the eye. */
export type ColorTone = "light" | "dark";

/**
 * Which of the two a colour is, judged by what reads on it: `light` when black has the higher
 * contrast against it, `dark` when white has. A mark on a `light` colour is drawn dark. Nothing
 * for text that is no hex colour.
 */
export function colorTone(color: string): ColorTone | undefined {
  const luminance = relativeLuminance(color);
  if (luminance === undefined) return undefined;
  // (L + 0.05) / 0.05 > 1.05 / (L + 0.05): black wins above L = sqrt(0.0525) - 0.05.
  return luminance > Math.sqrt(1.05 * 0.05) - 0.05 ? "light" : "dark";
}
