/**
 * Comparing two screenshots, and the picture that shows where they differ. Pure functions on PNG
 * buffers; `compare.ts` walks the folders and decides what a difference means.
 */
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export type DiffOptions = {
  /**
   * How far two pixels may be apart and still count as equal (0 to 1). The default is 0: a
   * shadow whose alpha moves from 0.06 to 0.08 shifts pixels by a handful of levels, and any
   * tolerance wide enough for comfort would wave exactly that through.
   */
  threshold?: number;
  /** How many differing pixels are still accepted. Default 0. */
  maxDiffPixels?: number;
};

export type Comparison =
  | { kind: "same" }
  | { kind: "changed"; pixels: number; strip: Buffer }
  | { kind: "resized"; from: string; to: string; pixels: number; strip: Buffer };

const GAP = 12;
/** The grey the contact sheets use, so a strip reads like one of them. */
const BACKGROUND = [217, 217, 222, 255];

/** `source` at the top left of a canvas of the given size; what it does not cover stays clear. */
function pad(source: PNG, width: number, height: number): PNG {
  if (source.width === width && source.height === height) return source;
  const canvas = new PNG({ width, height });
  PNG.bitblt(source, canvas, 0, 0, source.width, source.height, 0, 0);
  return canvas;
}

/** The panels side by side on the sheet grey: baseline, current, difference. */
function strip(panels: PNG[]): Buffer {
  const width = panels.reduce((sum, panel) => sum + panel.width, 0) + GAP * (panels.length + 1);
  const height = Math.max(...panels.map((panel) => panel.height)) + GAP * 2;
  const canvas = new PNG({ width, height });
  for (let offset = 0; offset < canvas.data.length; offset += 4) {
    canvas.data.set(BACKGROUND, offset);
  }
  let x = GAP;
  for (const panel of panels) {
    PNG.bitblt(panel, canvas, 0, 0, panel.width, panel.height, x, GAP);
    x += panel.width + GAP;
  }
  return PNG.sync.write(canvas);
}

/**
 * Compares a baseline shot with a current one. Identical files are `same` without being decoded.
 * Otherwise the result carries a strip (baseline, current, and the differing pixels in red over
 * a faded copy) to look at.
 */
export function comparePng(
  baseline: Buffer,
  current: Buffer,
  { threshold = 0, maxDiffPixels = 0 }: DiffOptions = {},
): Comparison {
  if (baseline.equals(current)) return { kind: "same" };
  const before = PNG.sync.read(baseline);
  const after = PNG.sync.read(current);
  const width = Math.max(before.width, after.width);
  const height = Math.max(before.height, after.height);
  const resized = before.width !== after.width || before.height !== after.height;
  const difference = new PNG({ width, height });
  const pixels = pixelmatch(
    pad(before, width, height).data,
    pad(after, width, height).data,
    difference.data,
    width,
    height,
    // Anti-aliased pixels count too: on one machine and one browser build they do not wander.
    { threshold, includeAA: true },
  );
  if (!resized && pixels <= maxDiffPixels) return { kind: "same" };
  const image = strip([before, after, difference]);
  return resized
    ? {
        kind: "resized",
        from: `${before.width}×${before.height}`,
        to: `${after.width}×${after.height}`,
        pixels,
        strip: image,
      }
    : { kind: "changed", pixels, strip: image };
}
