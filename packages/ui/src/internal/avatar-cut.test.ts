import { describe, expect, it } from "vitest";

import { avatarGeometry, avatarOverlap, type AvatarSize, cutMask, cutShapes } from "./avatar-cut";

const sizes = Object.keys(avatarGeometry) as AvatarSize[];

describe("cutShapes", () => {
  it("cuts the avatar in front grown by the gap, about its centre", () => {
    for (const size of sizes) {
      const { size: side } = avatarGeometry[size];
      const step = side - avatarOverlap.tight[size];
      const [front] = cutShapes({ size: side, gap: 2, step });
      // The avatar in front stands at x = -step; its centre is half a side in from there.
      expect(front).toEqual({ cx: side / 2 - step, cy: side / 2, r: side / 2 + 2 });
    }
  });

  it("leaves the avatar underneath a crescent of at least the overlap", () => {
    for (const overlap of Object.values(avatarOverlap)) {
      for (const size of sizes) {
        const { size: side } = avatarGeometry[size];
        const [front] = cutShapes({ size: side, gap: 2, step: side - overlap[size] });
        // The widest part of what is seen, along the middle line, is more than half the avatar.
        expect(side - (front!.cx + front!.r)).toBeGreaterThan(side / 2);
      }
    }
  });

  it("cuts a presence dot on the edge, the gap larger than the dot", () => {
    expect(cutShapes({ size: 28, gap: 2, dot: 8 })).toEqual([{ cx: 24, cy: 24, r: 6 }]);
  });

  it("cuts the dot of the avatar in front out of the one underneath", () => {
    const [, frontDot] = cutShapes({ size: 28, gap: 2, step: 21, frontDot: 8 });
    expect(frontDot).toEqual({ cx: 3, cy: 24, r: 6 });
  });

  it("mirrors every cut for right to left", () => {
    const circles = cutShapes({ size: 28, gap: 2, step: 21, dot: 8, rtl: true });
    expect(circles.map((circle) => circle.cx)).toEqual([35, 4]);
  });
});

describe("cutMask", () => {
  it("cuts nothing out of the avatar in front without a dot", () => {
    expect(cutMask({ size: 28, gap: 2 })).toBeUndefined();
  });

  it("is an encoded SVG that is the same for the same cut", () => {
    const mask = cutMask({ size: 28, gap: 2, step: 21, dot: 8 });
    expect(mask).toBe(cutMask({ size: 28, gap: 2, step: 21, dot: 8 }));
    expect(mask).toMatch(/^url\("data:image\/svg\+xml,%3Csvg/);
    expect(mask).not.toContain("#");
    expect(decodeURIComponent(mask!)).toContain('r="16"');
  });
});
