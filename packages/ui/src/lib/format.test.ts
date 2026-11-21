import { describe, expect, it } from "vitest";

import {
  formatMoney,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  numberFormatter,
  toTime,
} from "./format";

/** Intl writes a no-break space before a unit; the tests read it as a plain one. */
const plain = (text: string) => text.replaceAll(" ", " ").replaceAll(" ", " ");

const at = (year: number, month: number, date: number, hours = 0, minutes = 0) =>
  new Date(year, month - 1, date, hours, minutes).getTime();

describe("numbers", () => {
  it("writes German numbers", () => {
    expect(formatNumber(1234.5)).toBe("1.234,5");
    expect(formatNumber(12_480, { minimumFractionDigits: 2 })).toBe("12.480,00");
  });

  it("never writes a minus before what rounds to zero", () => {
    expect(formatNumber(-0.0001, { maximumFractionDigits: 2 })).toBe("0");
    expect(plain(formatMoney(-0.001))).toBe("0,00 €");
    expect(plain(formatPercent(-0.001))).toBe("0 %");
    expect(formatNumber(-3)).toBe("-3");
  });

  it("writes money with cents, or whole where asked", () => {
    expect(plain(formatMoney(1234.5))).toBe("1.234,50 €");
    expect(plain(formatMoney(117_074, { maximumFractionDigits: 0 }))).toBe("117.074 €");
    expect(plain(formatMoney(12, { currency: "USD" }))).toBe("12,00 $");
  });

  it("takes a percent as a share", () => {
    expect(plain(formatPercent(0.38))).toBe("38 %");
    expect(plain(formatPercent(0.998, { maximumFractionDigits: 1 }))).toBe("99,8 %");
    expect(plain(formatPercent(0.12, { signDisplay: "exceptZero" }))).toBe("+12 %");
  });

  it("writes in another language when asked", () => {
    expect(formatNumber(1234.5, { locale: "en-US" })).toBe("1,234.5");
    expect(formatNumber(1234.5, { locale: new Intl.Locale("en-US") })).toBe("1,234.5");
  });

  it("keeps one format per kind", () => {
    expect(numberFormatter("de-DE", { style: "percent" })).toBe(
      numberFormatter("de-DE", { style: "percent" }),
    );
  });
});

describe("relative time", () => {
  const now = at(2026, 11, 21, 14, 0);
  const said = (value: number, options = {}) => formatRelativeTime(value, { now, ...options });

  it("says a moment under a minute away in words", () => {
    expect(said(now - 20_000)).toBe("gerade eben");
    expect(said(now)).toBe("gerade eben");
    expect(said(now + 20_000)).toBe("gleich");
  });

  it("counts minutes under an hour, never rounding up to the next", () => {
    expect(said(at(2026, 11, 21, 13, 55))).toBe("vor 5 Minuten");
    expect(said(now - 59 * 60_000 - 59_000)).toBe("vor 59 Minuten");
    expect(said(at(2026, 11, 21, 14, 5))).toBe("in 5 Minuten");
    expect(said(at(2026, 11, 21, 13, 55), { style: "short" })).toBe("vor 5 Min.");
  });

  it("counts hours within the day", () => {
    expect(said(at(2026, 11, 21, 10, 30))).toBe("vor 3 Stunden");
    expect(said(at(2026, 11, 21, 0, 5))).toBe("vor 13 Stunden");
    expect(said(at(2026, 11, 21, 18, 0))).toBe("in 4 Stunden");
  });

  it("counts days by the calendar", () => {
    const night = at(2026, 11, 21, 1, 0);
    expect(formatRelativeTime(at(2026, 11, 20, 22, 0), { now: night })).toBe("gestern");
    // Under an hour it is still minutes, across midnight too.
    expect(formatRelativeTime(at(2026, 11, 20, 23, 50), { now: at(2026, 11, 21, 0, 30) })).toBe(
      "vor 40 Minuten",
    );
    expect(said(at(2026, 11, 19, 9, 0))).toBe("vorgestern");
    expect(said(at(2026, 11, 18, 9, 0))).toBe("vor 3 Tagen");
    expect(said(at(2026, 11, 15, 9, 0))).toBe("vor 6 Tagen");
    expect(said(at(2026, 11, 22, 9, 0))).toBe("morgen");
    expect(said(at(2026, 11, 24, 9, 0))).toBe("in 3 Tagen");
  });

  it("writes the date from a week on, with the year when it is another", () => {
    expect(said(at(2026, 11, 14, 9, 0))).toBe("14. Nov.");
    expect(formatRelativeTime(at(2026, 12, 20), { now: at(2027, 1, 2, 10) })).toBe("20. Dez. 2026");
    expect(formatRelativeTime(at(2026, 12, 31, 22), { now: at(2027, 1, 2, 10) })).toBe(
      "vorgestern",
    );
  });

  it("does not miscount the day the clocks change", () => {
    // 29 March 2026 has 23 hours in Central Europe.
    expect(formatRelativeTime(at(2026, 3, 28, 22), { now: at(2026, 3, 29, 12) })).toBe("gestern");
    const berlin = { timeZone: "Europe/Berlin" };
    expect(
      formatRelativeTime(Date.UTC(2026, 2, 28, 21), { now: Date.UTC(2026, 2, 29, 10), ...berlin }),
    ).toBe("gestern");
  });

  it("counts the days in the time zone it is given", () => {
    // 21:00 and 00:30 in Berlin, two days; 20:00 and 23:30 in UTC, one.
    const now = Date.UTC(2026, 10, 20, 23, 30);
    const then = Date.UTC(2026, 10, 20, 20, 0);
    expect(formatRelativeTime(then, { now, timeZone: "Europe/Berlin" })).toBe("gestern");
    expect(formatRelativeTime(then, { now, timeZone: "UTC" })).toBe("vor 3 Stunden");
  });

  it("takes its words, and another language's own", () => {
    expect(said(now - 1000, { justNow: "soeben" })).toBe("soeben");
    expect(said(now - 1000, { locale: "en-US" })).toBe("now");
    expect(said(at(2026, 11, 20, 9), { locale: "en-US" })).toBe("yesterday");
  });

  it("reads ISO strings and says nothing for what is no moment", () => {
    expect(formatRelativeTime("2026-11-20", { now })).toBe("gestern");
    expect(toTime("2026-11-20")).toBe(at(2026, 11, 20));
    expect(formatRelativeTime("kein Datum", { now })).toBe("");
  });
});
