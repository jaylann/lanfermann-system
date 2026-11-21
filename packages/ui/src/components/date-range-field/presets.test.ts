import { describe, expect, it } from "vitest";

import { lastDays, presetOf } from "./presets";

describe("presets", () => {
  it("counts the last days with today", () => {
    expect(lastDays(7).range("2026-11-21")).toEqual({ from: "2026-11-15", to: "2026-11-21" });
    expect(lastDays(28).range("2026-11-21")).toEqual({ from: "2026-10-25", to: "2026-11-21" });
    expect(lastDays(90).range("2026-11-21")).toEqual({ from: "2026-08-24", to: "2026-11-21" });
    expect(lastDays(1).range("2026-11-21")).toEqual({ from: "2026-11-21", to: "2026-11-21" });
  });

  it("counts days across the change to summer time and the turn of the year", () => {
    expect(lastDays(7).range("2026-04-01")).toEqual({ from: "2026-03-26", to: "2026-04-01" });
    expect(lastDays(7).range("2027-01-03")).toEqual({ from: "2026-12-28", to: "2027-01-03" });
  });

  it("is named in German unless named otherwise", () => {
    expect(lastDays(28).label).toBe("Letzte 28 Tage");
    expect(lastDays(28, "4 Wochen").label).toBe("4 Wochen");
  });

  it("knows no range on a day it does not know", () => {
    expect(lastDays(7).range("")).toEqual({ from: "", to: "" });
  });

  it("finds the preset a range is, by its days alone", () => {
    const presets = [lastDays(7), lastDays(28)];
    const today = "2026-11-21";
    expect(presetOf(presets, { from: "2026-10-25", to: "2026-11-21" }, today)?.label).toBe(
      "Letzte 28 Tage",
    );
    expect(
      presetOf(presets, { from: "2026-11-15T09:00", to: "2026-11-21T17:00" }, today)?.label,
    ).toBe("Letzte 7 Tage");
    expect(presetOf(presets, { from: "2026-11-14", to: "2026-11-21" }, today)).toBeUndefined();
    expect(presetOf(presets, { from: "2026-10-25", to: "2026-11-21" }, "")).toBeUndefined();
  });
});
