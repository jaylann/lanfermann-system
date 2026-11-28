import { describe, expect, it } from "vitest";

import {
  colorTone,
  contrastRatio,
  floorContrast,
  parseHexColor,
  relativeLuminance,
  TEXT_CONTRAST,
} from "./color";

describe("parseHexColor", () => {
  it("normalises to lower-case #rrggbb", () => {
    expect(parseHexColor("#5B4FCF")).toBe("#5b4fcf");
    expect(parseHexColor("#5b4fcf")).toBe("#5b4fcf");
  });

  it("accepts a missing # and surrounding space", () => {
    expect(parseHexColor("5b4fcf")).toBe("#5b4fcf");
    expect(parseHexColor("  #5b4fcf ")).toBe("#5b4fcf");
  });

  it("doubles the digits of the short form", () => {
    expect(parseHexColor("#abc")).toBe("#aabbcc");
    expect(parseHexColor("F0a")).toBe("#ff00aa");
  });

  it("reads nothing else", () => {
    for (const text of ["", "#", "#12", "#1234", "#12345", "#1234567", "#12345678", "#ggg", "rot"])
      expect(parseHexColor(text), text).toBeUndefined();
    expect(parseHexColor("rgb(0 0 0)")).toBeUndefined();
    expect(parseHexColor("##5b4fcf")).toBeUndefined();
  });
});

describe("relativeLuminance", () => {
  it("runs from black to white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
  });

  it("weighs green above red above blue", () => {
    expect(relativeLuminance("#ff0000")).toBeCloseTo(0.2126, 4);
    expect(relativeLuminance("#00ff00")).toBeCloseTo(0.7152, 4);
    expect(relativeLuminance("#0000ff")).toBeCloseTo(0.0722, 4);
  });

  it("has nothing to say about text that is no colour", () => {
    expect(relativeLuminance("indigo")).toBeUndefined();
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white, in either order", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 10);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 10);
  });

  it("is 1 for equal colours", () => {
    expect(contrastRatio("#5b4fcf", "#5B4FCF")).toBe(1);
    expect(contrastRatio("#ffffff", "fff")).toBe(1);
  });

  it("matches the published value of a known pair", () => {
    // #767676 is the lightest grey that passes AA on white: 4.54.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(TEXT_CONTRAST);
  });

  it("is nothing when one side is no colour", () => {
    expect(contrastRatio("#000000", "weiß")).toBeUndefined();
    expect(contrastRatio("", "#ffffff")).toBeUndefined();
  });
});

describe("floorContrast", () => {
  it("cuts to one decimal and never rounds up", () => {
    expect(floorContrast(4.49)).toBe(4.4);
    expect(floorContrast(4.5)).toBe(4.5);
    expect(floorContrast(21)).toBe(21);
    expect(floorContrast(1)).toBe(1);
  });

  it("is not thrown by binary fractions", () => {
    // 4.6 * 10 is 45.99999999999999 in floating point.
    expect(floorContrast(4.6)).toBe(4.6);
    expect(floorContrast(1.1)).toBe(1.1);
  });
});

describe("colorTone", () => {
  it("calls a colour light when black reads better on it", () => {
    expect(colorTone("#ffffff")).toBe("light");
    expect(colorTone("#f6d32d")).toBe("light");
    expect(colorTone("#9ad0a5")).toBe("light");
  });

  it("calls a colour dark when white reads better on it", () => {
    expect(colorTone("#000000")).toBe("dark");
    expect(colorTone("#5b4fcf")).toBe("dark");
    expect(colorTone("#bd1f3d")).toBe("dark");
  });

  it("agrees with the contrast of black and white at every grey", () => {
    for (let value = 0; value < 256; value += 1) {
      const grey = `#${value.toString(16).padStart(2, "0").repeat(3)}`;
      const onBlack = contrastRatio(grey, "#000000") ?? 0;
      const onWhite = contrastRatio(grey, "#ffffff") ?? 0;
      expect(colorTone(grey), grey).toBe(onBlack > onWhite ? "light" : "dark");
    }
  });

  it("has nothing to say about a custom property", () => {
    expect(colorTone("var(--lf-accent)")).toBeUndefined();
  });
});
