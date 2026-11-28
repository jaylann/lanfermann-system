import { describe, expect, it } from "vitest";

import { relativeChange, signedFormat, waterfallBars } from "./steps";

describe("the columns of a waterfall", () => {
  it("floats each step from the running sum and stands a total on zero", () => {
    const bars = waterfallBars([
      { name: "Einnahmen", value: 48_200 },
      { name: "Material", value: -14_800 },
      { name: "Fremdleistung", value: -6_300 },
      { name: "Ergebnis", value: 0, kind: "total" },
    ]);
    expect(bars.map((bar) => [bar.start, bar.end])).toEqual([
      [0, 48_200],
      [48_200, 33_400],
      [33_400, 27_100],
      [0, 27_100],
    ]);
    expect(bars[3]).toMatchObject({ total: true, change: 27_100, running: 27_100 });
  });

  it("keeps counting after a total in the middle", () => {
    const bars = waterfallBars([
      { name: "Monat 1", value: 5_000 },
      { name: "Bis Monat 1", value: 0, kind: "total" },
      { name: "Monat 2", value: -2_000 },
      { name: "Bis Monat 2", value: 999, kind: "total" },
    ]);
    expect(bars[2]).toMatchObject({ start: 5_000, end: 3_000 });
    // A total's own value is ignored: it shows the sum so far.
    expect(bars[3]).toMatchObject({ start: 0, end: 3_000 });
  });

  it("goes below zero for a loss", () => {
    const bars = waterfallBars([
      { name: "Einnahmen", value: 2_000 },
      { name: "Ausgaben", value: -5_000 },
      { name: "Ergebnis", value: 0, kind: "total" },
    ]);
    expect(bars[1]).toMatchObject({ start: 2_000, end: -3_000, change: -5_000 });
    expect(bars[2]).toMatchObject({ start: 0, end: -3_000 });
  });

  it("adds nothing for a value that is not a number", () => {
    const bars = waterfallBars([
      { name: "A", value: 10 },
      { name: "B", value: Number.NaN },
    ]);
    expect(bars[1]).toMatchObject({ start: 10, end: 10, change: 0 });
  });

  it("is empty without steps, and a lone total stands at zero", () => {
    expect(waterfallBars([])).toEqual([]);
    expect(waterfallBars([{ name: "Summe", value: 0, kind: "total" }])[0]).toMatchObject({
      start: 0,
      end: 0,
    });
  });
});

describe("a change before and after", () => {
  it("is a share of the value before", () => {
    expect(relativeChange(95, 105)).toBeCloseTo(0.10526, 4);
    expect(relativeChange(40, 30)).toBeCloseTo(-0.25);
  });

  it("is nothing when nothing changed, also at zero", () => {
    expect(relativeChange(12, 12)).toBe(0);
    expect(relativeChange(0, 0)).toBe(0);
  });

  it("has no share from zero", () => {
    expect(relativeChange(0, 5)).toBeNull();
  });

  it("rises from a negative value towards zero", () => {
    expect(relativeChange(-10, -5)).toBeCloseTo(0.5);
  });
});

describe("a signed figure", () => {
  const euro = signedFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const percent = signedFormat("de-DE", { style: "percent", maximumFractionDigits: 0 });

  it("writes the sign of a gain and the typographic minus of a loss", () => {
    expect(euro(12_400)).toMatch(/^\+12\.400\s€$/u);
    expect(euro(-3_100)).toMatch(/^−3\.100\s€$/u);
    expect(percent(0.105)).toMatch(/^\+11\s%$/u);
    expect(percent(-0.08)).toMatch(/^−8\s%$/u);
  });

  it("says ±0 for what rounds to nothing", () => {
    expect(euro(0)).toMatch(/^±0\s€$/u);
    expect(percent(0.001)).toMatch(/^±0\s%$/u);
    expect(percent(-0.001)).toMatch(/^±0\s%$/u);
  });

  it("keeps a loss that an accounting format writes in brackets", () => {
    const dollar = signedFormat("en-US", {
      style: "currency",
      currency: "USD",
      currencySign: "accounting",
      maximumFractionDigits: 0,
    });
    expect(dollar(-3_100)).toBe("($3,100)");
    expect(dollar(3_100)).toBe("+$3,100");
    expect(dollar(0)).toBe("±$0");
  });
});
