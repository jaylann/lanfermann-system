import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

import { comparePng } from "./diff.ts";

/** A flat grey PNG; `tweak` may change single pixels before it is encoded. */
function png(width: number, height: number, tweak?: (image: PNG) => void): Buffer {
  const image = new PNG({ width, height });
  image.data.fill(200);
  tweak?.(image);
  return PNG.sync.write(image);
}

describe("comparePng", () => {
  it("calls identical files the same", () => {
    expect(comparePng(png(8, 8), png(8, 8))).toEqual({ kind: "same" });
  });

  it("calls files the same when only their encoding differs", () => {
    const image = new PNG({ width: 8, height: 8 });
    image.data.fill(200);
    const loose = PNG.sync.write(image, { deflateLevel: 0 });
    const tight = PNG.sync.write(image, { deflateLevel: 9 });
    expect(loose.equals(tight)).toBe(false);
    expect(comparePng(loose, tight)).toEqual({ kind: "same" });
  });

  it("notices one pixel that moved by a single level", () => {
    const result = comparePng(
      png(8, 8),
      png(8, 8, (image) => {
        image.data[0] = 201;
      }),
    );
    expect(result).toMatchObject({ kind: "changed", pixels: 1 });
  });

  it("lets a difference pass only when a tolerance is asked for", () => {
    const moved = png(8, 8, (image) => {
      image.data[0] = 201;
    });
    expect(comparePng(png(8, 8), moved, { maxDiffPixels: 1 })).toEqual({ kind: "same" });
    expect(comparePng(png(8, 8), moved, { threshold: 0.1 })).toEqual({ kind: "same" });
  });

  it("reports a change of size, whatever the pixels say", () => {
    const result = comparePng(png(8, 8), png(10, 8));
    expect(result).toMatchObject({ kind: "resized", from: "8×8", to: "10×8" });
  });

  it("draws baseline, current and difference side by side", () => {
    const result = comparePng(
      png(8, 6),
      png(8, 6, (image) => {
        image.data[0] = 0;
      }),
    );
    if (result.kind !== "changed") throw new Error("expected a change");
    const strip = PNG.sync.read(result.strip);
    // Three panels of 8px and four gaps of 12px; one panel height and two gaps.
    expect([strip.width, strip.height]).toEqual([3 * 8 + 4 * 12, 6 + 2 * 12]);
  });
});
