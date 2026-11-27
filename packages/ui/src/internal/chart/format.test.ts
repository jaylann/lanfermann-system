import { describe, expect, it } from "vitest";

import { axisDigits, axisOptions, chartFormat } from "./format";
import { valueAxis } from "./scale";

const euro = { style: "currency", currency: "EUR" } as const;
const dollar = { style: "currency", currency: "USD" } as const;
const percent = { style: "percent" } as const;

/** The labels of an axis as a reader sees them: the no-break spaces of a format as plain ones. */
function labels(
  ticks: readonly number[],
  locale: string,
  options?: Intl.NumberFormatOptions,
): string[] {
  const label = chartFormat(locale, options).axisFor(ticks);
  return ticks.map((tick) => label(tick).replace(/[\u00a0\u202f]/g, " "));
}

describe("the decimals of an axis", () => {
  it.each([
    ["a quarter step", [0, 0.25, 0.5, 0.75, 1], 2],
    ["a step of two and a half", [0, 2.5, 5, 7.5, 10], 1],
    ["a step of twenty-five", [0, 25, 50, 75, 100], 0],
    ["a step of a tenth", [0, 0.1, 0.2, 0.3], 1],
    ["a step of 0.025", [0, 0.025, 0.05, 0.075, 0.1], 3],
    ["quarters of a million, compact", [0, 250_000, 500_000, 750_000, 1_000_000, 1_250_000], 2],
    ["halves of a million, compact", [0, 500_000, 1_000_000, 1_500_000], 1],
    ["whole thousands", [0, 5000, 10_000, 15_000], 0],
    ["no line at all", [], 0],
  ])("%s", (_name, ticks, digits) => {
    expect(axisDigits(ticks)).toBe(digits);
  });

  it("counts the written label, so a share counts in percent", () => {
    expect(axisDigits([0, 0.25, 0.5, 0.75, 1], "de-DE", percent)).toBe(0);
    expect(axisDigits([0, 0.025, 0.05, 0.075, 0.1], "de-DE", percent)).toBe(1);
    expect(axisDigits([0, 0.0025, 0.005, 0.0075, 0.01], "de-DE", percent)).toBe(2);
  });

  it("counts the compact unit of the locale", () => {
    // English shortens thousands („2.5K“), German does not („2.500“).
    expect(axisDigits([0, 2500, 5000], "en-US")).toBe(1);
    expect(axisDigits([0, 2500, 5000], "de-DE")).toBe(0);
  });

  it("is not misled by float noise", () => {
    expect(axisDigits([0, 0.1, 0.2, 0.1 + 0.2])).toBe(1);
    expect(axisDigits([0.30000000000000004, 0.7999999999999999])).toBe(1);
  });

  it("skips what is not a number", () => {
    expect(axisDigits([0, Number.NaN, 0.5, Infinity])).toBe(1);
  });

  it("is not raised by the caller's own decimals", () => {
    expect(axisDigits([0, 25, 50], "de-DE", { ...euro, minimumFractionDigits: 2 })).toBe(0);
  });
});

describe("the options of an axis", () => {
  it("stay compact and grouped, with the decimals of its lines", () => {
    expect(axisOptions(euro, [0, 0.25, 0.5])).toEqual({
      ...euro,
      notation: "compact",
      useGrouping: "always",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
  });

  it("override the caller's decimals, which are for a value read alone", () => {
    const options = axisOptions({ ...euro, maximumFractionDigits: 0 }, [0, 0.25, 0.5]);
    expect(options.maximumFractionDigits).toBe(2);
    expect(axisOptions({ ...euro, maximumFractionDigits: 2 }, [0, 5, 10])).toMatchObject({
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  });
});

describe("the labels of an axis", () => {
  it("say quarter steps in full, in dollars and euros, German and English", () => {
    const quarters = [0, 0.25, 0.5, 0.75, 1];
    expect(labels(quarters, "de-DE", dollar)).toEqual(["0 $", "0,25 $", "0,5 $", "0,75 $", "1 $"]);
    expect(labels(quarters, "de-DE", euro)).toEqual(["0 €", "0,25 €", "0,5 €", "0,75 €", "1 €"]);
    expect(labels(quarters, "en-US", dollar)).toEqual(["$0", "$0.25", "$0.5", "$0.75", "$1"]);
    expect(labels(quarters, "en-US", euro)).toEqual(["€0", "€0.25", "€0.5", "€0.75", "€1"]);
  });

  it("say the axis `valueAxis` gives a month almost without costs", () => {
    const { ticks } = valueAxis([0, 0.83]);
    expect(labels(ticks, "de-DE", dollar)).toEqual(["0 $", "0,25 $", "0,5 $", "0,75 $", "1 $"]);
  });

  it("keep one decimal for a step of two and a half", () => {
    expect(labels([0, 2.5, 5, 7.5, 10], "de-DE")).toEqual(["0", "2,5", "5", "7,5", "10"]);
  });

  it("keep whole numbers whole, whatever the caller's decimals are", () => {
    const ticks = [0, 5000, 10_000, 15_000];
    expect(labels(ticks, "de-DE", euro)).toEqual(["0 €", "5.000 €", "10.000 €", "15.000 €"]);
    expect(labels(ticks, "de-DE", { ...euro, minimumFractionDigits: 2 })).toEqual(
      labels(ticks, "de-DE", euro),
    );
  });

  it("stay compact for millions, with the quarter of a million", () => {
    const ticks = [0, 250_000, 500_000, 750_000, 1_000_000, 1_250_000];
    expect(labels(ticks, "de-DE", euro)).toEqual([
      "0 €",
      "250.000 €",
      "500.000 €",
      "750.000 €",
      "1 Mio. €",
      "1,25 Mio. €",
    ]);
    expect(labels(ticks, "en-US")).toEqual(["0", "250K", "500K", "750K", "1M", "1.25M"]);
  });

  it("say shares in percent", () => {
    expect(labels([0, 0.25, 0.5, 0.75, 1], "de-DE", percent)).toEqual([
      "0 %",
      "25 %",
      "50 %",
      "75 %",
      "100 %",
    ]);
    expect(labels([0, 0.025, 0.05, 0.075, 0.1], "de-DE", percent)).toEqual([
      "0 %",
      "2,5 %",
      "5 %",
      "7,5 %",
      "10 %",
    ]);
  });

  it("say a range below zero, and never a minus before zero", () => {
    const { ticks } = valueAxis([-0.45, 0.5]);
    expect(ticks).toEqual([-0.5, -0.25, 0, 0.25, 0.5]);
    expect(labels(ticks, "de-DE", euro)).toEqual(["-0,5 €", "-0,25 €", "0 €", "0,25 €", "0,5 €"]);
    expect(labels([-1, -0.75, -0.5, -0.25, -0], "en-US", dollar)).toEqual([
      "-$1",
      "-$0.75",
      "-$0.5",
      "-$0.25",
      "$0",
    ]);
  });

  it("leave float noise out", () => {
    expect(labels([0, 0.1, 0.2, 0.30000000000000004], "de-DE")).toEqual(["0", "0,1", "0,2", "0,3"]);
  });

  it("are one format per set of lines, and the same one for the same lines", () => {
    const numbers = chartFormat("de-DE", dollar);
    expect(chartFormat("de-DE", { ...dollar })).toBe(numbers);
    // A coarser axis after a finer one must not inherit its decimals, nor the other way round.
    expect(numbers.axisFor([0, 0.25, 0.5])(0.25)).toMatch(/^0,25/);
    expect(numbers.axisFor([0, 25, 50])(25)).toMatch(/^25\s/);
    expect(numbers.axisFor([0, 0.25, 0.5])(0.25)).toMatch(/^0,25/);
  });

  it("leave a value read on its own as the caller wrote it", () => {
    expect(
      chartFormat("de-DE", euro)
        .value(0.25)
        .replace(/\u00a0/g, " "),
    ).toBe("0,25 €");
    expect(chartFormat("de-DE", { ...euro, maximumFractionDigits: 0 }).value(1234.5)).toMatch(
      /^1\.235/,
    );
  });
});
