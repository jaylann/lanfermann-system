import { describe, expect, it } from "vitest";

import {
  cameraAt,
  cameraTransform,
  easeInOutCubic,
  fitView,
  insideBox,
  isNear,
  sameCamera,
  screenRect,
} from "./camera";

// A scene's box: the content width, 480px high. With the 48px left above a view
// for a group's label, a view has 1664 by 432 px.
const BOX = { w: 1664, h: 480 };

describe("fitView", () => {
  it("fits a wide view by its width and stands it on the top inset", () => {
    // 1664 / 3328 = 0.5 across, 432 / 400 = 1.08 down: the width decides.
    expect(fitView({ x: 0, y: 0, w: 3328, h: 400 }, BOX)).toEqual({ x: 0, y: 48, scale: 0.5 });
  });

  it("moves the origin by the view's corner, scaled", () => {
    // Both ways 0.5; the corner (100, 200) lands on (0, 48).
    expect(fitView({ x: 100, y: 200, w: 3328, h: 864 }, BOX)).toEqual({
      x: -50,
      y: -52,
      scale: 0.5,
    });
  });

  it("puts a tall view at the left, in the middle or at the right", () => {
    // 432 / 864 = 0.5: 400px drawn, 1264px left across.
    const tall = { x: 0, y: 0, w: 800, h: 864 };
    expect(fitView(tall, BOX).x).toBe(0);
    expect(fitView(tall, BOX, { align: "center" }).x).toBe(632);
    expect(fitView(tall, BOX, { align: "end" }).x).toBe(1264);
  });

  it("never draws a world unit larger than a px", () => {
    // One node at column 2, row 2: it would fit 5.2 times across, but stays at 1.
    expect(fitView({ x: 416, y: 144, w: 320, h: 112 }, BOX)).toEqual({
      x: -416,
      y: -96,
      scale: 1,
    });
  });

  it("shows a point at the largest scale", () => {
    expect(fitView({ x: 10, y: 20, w: 0, h: 0 }, BOX)).toEqual({ x: -10, y: 28, scale: 1 });
  });

  it("takes other insets and a larger maximum", () => {
    const none = { top: 0, right: 0, bottom: 0, left: 0 };
    expect(fitView({ x: 0, y: 0, w: 832, h: 240 }, BOX, { insets: none, maxScale: 4 })).toEqual({
      x: 0,
      y: 0,
      scale: 2,
    });
  });
});

describe("where the world is drawn", () => {
  const camera = { x: -50, y: 10, scale: 0.5 };

  it("scales a rectangle and moves it by the camera", () => {
    expect(screenRect({ x: 100, y: 50, w: 320, h: 112 }, camera)).toEqual({
      x: 0,
      y: 35,
      w: 160,
      h: 56,
    });
  });

  it("knows what is wholly inside the box, give or take a px", () => {
    expect(insideBox({ x: 100, y: 50, w: 320, h: 112 }, camera, BOX)).toBe(true);
    // Drawn from 1650 to 1810: past the right edge.
    expect(insideBox({ x: 3400, y: 50, w: 320, h: 112 }, camera, BOX)).toBe(false);
    // Drawn from x -0.5: within the px of tolerance.
    expect(insideBox({ x: 99, y: 50, w: 320, h: 112 }, camera, BOX)).toBe(true);
  });

  it("asks for room above when told to (a group's label)", () => {
    // Drawn at y 35, but 40px are asked for above it.
    expect(insideBox({ x: 100, y: 50, w: 320, h: 112 }, camera, BOX, 1, 40)).toBe(false);
    expect(insideBox({ x: 100, y: 50, w: 320, h: 112 }, camera, BOX, 1, 30)).toBe(true);
  });

  it("shows a node's text from scale 0.75", () => {
    expect(isNear(1)).toBe(true);
    expect(isNear(0.75)).toBe(true);
    expect(isNear(0.7499)).toBe(false);
  });
});

describe("the travel", () => {
  it("eases in and out on the cubic", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.25)).toBe(0.0625);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(0.75)).toBe(0.9375);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });

  it("starts where it starts and ends where it ends", () => {
    const from = { x: 0, y: 0, scale: 1 };
    const to = { x: -800, y: 30, scale: 0.4 };
    expect(cameraAt(from, to, BOX, 0)).toBe(from);
    expect(cameraAt(from, to, BOX, 1)).toBe(to);
  });

  it("zooms evenly in the logarithm about the point in the box's middle", () => {
    // From scale 1 to 4, both with the world's corner on the box's: halfway the scale is 2, not
    // 2.5. The world point in the middle moves from (832, 240) to (208, 60), halfway (520, 150),
    // which is drawn at the middle: x = 832 - 520 * 2, y = 240 - 150 * 2.
    const halfway = cameraAt({ x: 0, y: 0, scale: 1 }, { x: 0, y: 0, scale: 4 }, BOX, 0.5);
    expect(halfway.scale).toBeCloseTo(2, 10);
    expect(halfway.x).toBeCloseTo(-208, 6);
    expect(halfway.y).toBeCloseTo(-60, 6);
  });

  it("pans on the eased curve when the scale stays", () => {
    // A quarter of the time is 0.0625 of the way: 62.5 of 1000px.
    const quarter = cameraAt({ x: 0, y: 0, scale: 1 }, { x: -1000, y: 0, scale: 1 }, BOX, 0.25);
    expect(quarter.x).toBeCloseTo(-62.5, 6);
    expect(quarter.y).toBeCloseTo(0, 6);
  });

  it("calls two cameras the same within a hundredth of a px", () => {
    expect(sameCamera({ x: 1, y: 2, scale: 0.5 }, { x: 1.004, y: 2, scale: 0.5 })).toBe(true);
    expect(sameCamera({ x: 1, y: 2, scale: 0.5 }, { x: 1.02, y: 2, scale: 0.5 })).toBe(false);
  });

  it("writes the camera as a translation, then a scale", () => {
    expect(cameraTransform({ x: -416, y: -96.456, scale: 0.5 })).toBe(
      "translate(-416px, -96.46px) scale(0.5)",
    );
  });
});
