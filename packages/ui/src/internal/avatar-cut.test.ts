import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  avatarGeometry,
  avatarOverlap,
  type AvatarSize,
  cleanCut,
  cutMask,
  cutShapes,
} from "./avatar-cut";

const sizes = Object.keys(avatarGeometry) as AvatarSize[];

describe("avatarGeometry", () => {
  it("has the radii of radius.css at a 16px root", () => {
    const css = readFileSync(join(import.meta.dirname, "../styles/radius.css"), "utf8");
    const base = Number(/--radius-base:\s*([\d.]+)rem/.exec(css)?.[1]) * 16;
    const radius = (name: string) => {
      const line = new RegExp(`--radius-${name}:\\s*([^;]+);`).exec(css)?.[1] ?? "";
      const offset = / ([-+]) (\d+)px/.exec(line);
      if (!offset) return base;
      return offset[1] === "-" ? base - Number(offset[2]) : base + Number(offset[2]);
    };
    // Avatar takes rounded-xs, -sm, -md and -lg for sm, md, lg and xl.
    expect(sizes.map((size) => avatarGeometry[size].radius)).toEqual(
      ["xs", "sm", "md", "lg"].map(radius),
    );
  });
});

describe("cleanCut", () => {
  it("holds for every overlap the group offers, at both gaps", () => {
    for (const overlap of Object.values(avatarOverlap)) {
      for (const size of sizes) {
        for (const gap of [2, 3]) {
          expect(cleanCut(avatarGeometry[size].radius, overlap[size], gap)).toBe(true);
        }
      }
    }
  });

  it("fails where a quarter would let the corner underneath show", () => {
    expect(cleanCut(8, 9, 2)).toBe(false);
    expect(cleanCut(10, 12, 2)).toBe(false);
  });
});

describe("cutShapes", () => {
  it("rounds the cut about the corners of the avatar in front", () => {
    for (const size of sizes) {
      const { size: side, radius } = avatarGeometry[size];
      const gap = 2;
      const step = side - avatarOverlap.tight[size];
      const { rect } = cutShapes({ size: side, radius, gap, step });
      // The avatar in front stands at x = -step; its top-right corner turns about this centre.
      expect([rect!.x + rect!.width - rect!.rx, rect!.y + rect!.rx]).toEqual([
        -step + side - radius,
        radius,
      ]);
      expect(rect!.rx).toBe(radius + gap);
    }
  });

  it("cuts a presence dot out of the bottom corner, the gap larger than the dot", () => {
    expect(cutShapes({ size: 28, radius: 6, gap: 2, dot: 8 }).circle).toEqual({
      cx: 24,
      cy: 24,
      r: 6,
    });
    expect(cutShapes({ size: 28, radius: 6, gap: 2, dot: 8, rtl: true }).circle?.cx).toBe(4);
  });

  it("mirrors the cut for right to left", () => {
    const { rect } = cutShapes({ size: 28, radius: 6, gap: 2, step: 19, rtl: true });
    expect(rect?.x).toBe(17);
  });
});

describe("cutMask", () => {
  it("cuts nothing out of the avatar in front without a dot", () => {
    expect(cutMask({ size: 28, radius: 6, gap: 2 })).toBeUndefined();
  });

  it("is an encoded SVG that is the same for the same cut", () => {
    const mask = cutMask({ size: 28, radius: 6, gap: 2, step: 19, dot: 8 });
    expect(mask).toBe(cutMask({ size: 28, radius: 6, gap: 2, step: 19, dot: 8 }));
    expect(mask).toMatch(/^url\("data:image\/svg\+xml,%3Csvg/);
    expect(mask).not.toContain("#");
    expect(decodeURIComponent(mask!)).toContain('rx="8"');
  });
});
