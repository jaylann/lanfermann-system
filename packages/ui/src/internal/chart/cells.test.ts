import { describe, expect, it } from "vitest";

import {
  calendar,
  dayKey,
  daysBetween,
  mondayOf,
  startOfDay,
  stepBounds,
  stepOf,
  weekday,
} from "./cells";

const day = (year: number, month: number, date: number, hours = 0) =>
  new Date(year, month - 1, date, hours).getTime();

describe("days and weeks", () => {
  it("starts a week on Monday", () => {
    // 2026-11-20 is a Friday.
    expect(weekday(day(2026, 11, 20))).toBe(4);
    expect(weekday(day(2026, 11, 16))).toBe(0);
    expect(weekday(day(2026, 11, 22))).toBe(6);
    expect(mondayOf(day(2026, 11, 22, 18))).toBe(day(2026, 11, 16));
    expect(mondayOf(day(2026, 11, 16, 9))).toBe(day(2026, 11, 16));
  });

  it("finds Monday across the turn of a year", () => {
    // 2027-01-01 is a Friday; its week began in 2026.
    expect(mondayOf(day(2027, 1, 1))).toBe(day(2026, 12, 28));
  });

  it("counts calendar days, also across a change to summer and winter time", () => {
    expect(daysBetween(day(2026, 3, 28), day(2026, 3, 30))).toBe(2);
    expect(daysBetween(day(2026, 10, 24), day(2026, 10, 26, 23))).toBe(2);
    expect(daysBetween(day(2026, 1, 1), day(2026, 12, 31))).toBe(364);
    expect(startOfDay(day(2026, 3, 29, 15))).toBe(day(2026, 3, 29));
  });

  it("writes a day as a key", () => {
    expect(dayKey(day(2026, 3, 5, 13))).toBe("2026-03-05");
  });
});

describe("a calendar of weeks", () => {
  it("lays a year out in weeks, Monday on top", () => {
    const year = calendar(day(2025, 11, 21), day(2026, 11, 20));
    expect(year.days).toHaveLength(365);
    expect(year.columns).toBeGreaterThanOrEqual(53);
    expect(year.columns).toBeLessThanOrEqual(54);
    for (const entry of year.days) {
      expect(entry.row).toBe(weekday(entry.time));
      expect(entry.column).toBeGreaterThanOrEqual(0);
      expect(entry.column).toBeLessThan(year.columns);
    }
    // Every day has a place of its own.
    const places = new Set(year.days.map((entry) => `${entry.column}:${entry.row}`));
    expect(places.size).toBe(year.days.length);
  });

  it("goes on to the next column after Sunday, across the turn of the year", () => {
    const { days } = calendar(day(2026, 12, 26), day(2027, 1, 5));
    const sunday = days.find((entry) => entry.time === day(2027, 1, 3))!;
    const monday = days.find((entry) => entry.time === day(2027, 1, 4))!;
    expect(sunday.row).toBe(6);
    expect(monday.row).toBe(0);
    expect(monday.column).toBe(sunday.column + 1);
  });

  it("keeps each day once across a change to summer time", () => {
    const { days } = calendar(day(2026, 3, 23), day(2026, 4, 5));
    expect(days).toHaveLength(14);
    expect(days.map((entry) => entry.row)).toEqual([0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6]);
    expect(days.map((entry) => entry.column)).toEqual([0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1]);
  });

  it("names the months over the weeks that begin in them, never two side by side", () => {
    const { months } = calendar(day(2025, 11, 21), day(2026, 11, 20));
    expect(months.length).toBeGreaterThanOrEqual(12);
    expect(months.length).toBeLessThanOrEqual(13);
    for (let index = 1; index < months.length; index++) {
      expect(months[index]!.column - months[index - 1]!.column).toBeGreaterThanOrEqual(2);
    }
  });

  it("is empty when it ends before it starts", () => {
    expect(calendar(day(2026, 2, 2), day(2026, 2, 1))).toEqual({
      days: [],
      columns: 0,
      months: [],
    });
  });
});

describe("the steps of a count", () => {
  it("keeps zero a step of its own", () => {
    const bounds = stepBounds([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(stepOf(0, bounds)).toBe(0);
    expect(stepOf(null, bounds)).toBe(0);
    expect(stepOf(1, bounds)).toBe(1);
  });

  it("splits what is above zero into quarters", () => {
    const values = Array.from({ length: 100 }, (_, index) => index + 1);
    const bounds = stepBounds(values);
    const counts = [0, 0, 0, 0, 0];
    for (const value of values) counts[stepOf(value, bounds)]!++;
    for (const count of counts.slice(1)) expect(count).toBeGreaterThanOrEqual(24);
  });

  it("does not let one busy day push every other one into the first step", () => {
    const bounds = stepBounds([1, 2, 3, 4, 5, 6, 7, 8, 500]);
    expect(stepOf(8, bounds)).toBe(4);
    expect(stepOf(500, bounds)).toBe(4);
    expect(stepOf(5, bounds)).toBeGreaterThan(1);
  });

  it("has only one step above nothing when every day is the same", () => {
    const bounds = stepBounds([3, 3, 3]);
    expect(stepOf(3, bounds)).toBe(1);
    expect(stepBounds([])).toEqual([0, 0, 0]);
  });
});
