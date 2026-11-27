import { describe, expect, it } from "vitest";

import { liftOf } from "./toaster-lift";

/** A window 800px high whose toasts' column begins 600px from the left. */
const HEIGHT = 800;
const COLUMN = 600;

describe("liftOf", () => {
  it("lifts by the room a bar takes at the foot of the window", () => {
    // 44px high, 16px above the foot, reaching under the column.
    expect(liftOf({ top: 740, bottom: 784, right: 700 }, 0, HEIGHT, COLUMN)).toBe(60);
  });

  it("measures a rising bar where it will stand, not where it is drawn", () => {
    expect(liftOf({ top: 748, bottom: 792, right: 700 }, 8, HEIGHT, COLUMN)).toBe(60);
  });

  it("leaves the toasts alone beside a bar that ends before their column", () => {
    expect(liftOf({ top: 740, bottom: 784, right: 560 }, 0, HEIGHT, COLUMN)).toBe(0);
  });

  it("does not lift for a sticky bar that has not reached the foot", () => {
    expect(liftOf({ top: 400, bottom: 444, right: 700 }, 0, HEIGHT, COLUMN)).toBe(0);
  });

  it("does not lift for a bar below the window", () => {
    expect(liftOf({ top: 900, bottom: 944, right: 700 }, 0, HEIGHT, COLUMN)).toBe(0);
  });

  it("takes a tall composer as it is", () => {
    expect(liftOf({ top: 560, bottom: 784, right: 760 }, 0, HEIGHT, COLUMN)).toBe(240);
  });
});
