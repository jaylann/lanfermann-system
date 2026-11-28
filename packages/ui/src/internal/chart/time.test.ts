import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { inferInterval, pointLabel, tickLabel, timeTicks, toTime } from "./time";

const day = (year: number, month: number, date: number, hours = 0) =>
  new Date(year, month - 1, date, hours).getTime();

const days = (from: number, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(from);
    date.setDate(date.getDate() + index);
    return date.getTime();
  });

describe("reading moments", () => {
  it("takes a plain ISO date as local midnight", () => {
    expect(toTime("2026-11-14")).toBe(day(2026, 11, 14));
  });

  it("takes dates and numbers as they are", () => {
    const time = day(2026, 1, 1);
    expect(toTime(new Date(time))).toBe(time);
    expect(toTime(time)).toBe(time);
  });

  it("tells what a point stands for by how far apart they are", () => {
    expect(inferInterval(days(day(2026, 11, 1), 30))).toBe("day");
    expect(inferInterval([day(2026, 1, 1), day(2026, 2, 1), day(2026, 3, 1)])).toBe("month");
    expect(inferInterval([day(2026, 1, 1, 0), day(2026, 1, 1, 1), day(2026, 1, 1, 2)])).toBe(
      "hour",
    );
    expect(inferInterval([day(2026, 11, 2), day(2026, 11, 9), day(2026, 11, 16)])).toBe("week");
    expect(inferInterval([day(2024, 1, 1), day(2025, 1, 1)])).toBe("year");
  });

  it("never reads two points as the same day, month or year", () => {
    const hour = 3_600_000;
    const sixHourly = [0, 6, 12, 18].map((hours) => day(2026, 11, 18) + hours * hour);
    expect(inferInterval(sixHourly)).toBe("hour");
    expect(new Set(sixHourly.map((time) => pointLabel(time, "hour"))).size).toBe(4);
    // A fortnight apart: by their date, not two to a month.
    expect(inferInterval([day(2026, 11, 2), day(2026, 11, 16), day(2026, 11, 30)])).toBe("week");
    // Quarters and half-years: by their month, not several to a year.
    expect(
      inferInterval([day(2026, 1, 1), day(2026, 4, 1), day(2026, 7, 1), day(2026, 10, 1)]),
    ).toBe("month");
    expect(inferInterval([day(2026, 1, 1), day(2026, 7, 1), day(2027, 1, 1)])).toBe("month");
  });
});

describe("the marks of a time axis", () => {
  it("marks thirty days on the calendar's round days", () => {
    const series = days(day(2026, 10, 22), 30);
    const ticks = timeTicks(series[0]!, series.at(-1)!, { interval: "day" });
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks.length).toBeLessThanOrEqual(8);
    for (const tick of ticks) {
      const date = new Date(tick.time);
      expect([1, 5, 10, 15, 20, 25]).toContain(date.getDate());
      expect(date.getHours()).toBe(0);
    }
  });

  it("keeps the coarser marks in place as it narrows", () => {
    const series = days(day(2026, 10, 22), 30);
    const ticks = timeTicks(series[0]!, series.at(-1)!, { interval: "day" });
    const narrow = ticks.filter((tick) => tick.level === 0);
    const medium = ticks.filter((tick) => tick.level <= 1);
    expect(narrow.length).toBeGreaterThanOrEqual(1);
    expect(narrow.length).toBeLessThanOrEqual(3);
    expect(medium.length).toBeLessThanOrEqual(5);
    // What a narrow chart shows, a wider one shows too: the sets are nested.
    for (const tick of narrow) expect(medium).toContain(tick);
  });

  it("marks a year of months by months, and the new year by its number", () => {
    const months = Array.from({ length: 12 }, (_, index) =>
      new Date(2025, 11 + index, 1).getTime(),
    );
    const ticks = timeTicks(months[0]!, months.at(-1)!, { interval: "month" });
    expect(ticks.every((tick) => tick.unit === "month")).toBe(true);
    const january = ticks.find((tick) => new Date(tick.time).getMonth() === 0);
    expect(january?.turn).toBe(true);
    expect(tickLabel(january!)).toBe("2026");
    expect(tickLabel(ticks.find((tick) => !tick.turn)!)).toMatch(/^[A-ZÄÖÜ][a-zäöü]+\.?$/);
  });

  it("never marks finer than a point", () => {
    const months = [day(2026, 1, 1), day(2026, 2, 1), day(2026, 3, 1)];
    const ticks = timeTicks(months[0]!, months.at(-1)!, { interval: "month" });
    expect(ticks.map((tick) => new Date(tick.time).getDate())).toEqual([1, 1, 1]);
  });

  it("marks whole hours of the local clock, across a change to summer time", () => {
    const start = day(2026, 3, 28, 12);
    const end = day(2026, 3, 30, 12);
    const ticks = timeTicks(start, end, { interval: "hour" });
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    for (const tick of ticks) expect(new Date(tick.time).getMinutes()).toBe(0);
    const hours = ticks.map((tick) => new Date(tick.time).getHours());
    const step = hours.find((hour) => hour > 0) ?? 24;
    for (const hour of hours) expect(hour % step).toBe(0);
  });

  it("names a turn of the day by its date", () => {
    const start = day(2026, 11, 13, 18);
    const end = day(2026, 11, 14, 6);
    const midnight = timeTicks(start, end, { interval: "hour" }).find((tick) => tick.turn);
    expect(midnight && tickLabel(midnight)).toBe("14. Nov.");
  });

  it("has nothing to mark without a span", () => {
    expect(timeTicks(5, 5)).toEqual([]);
  });

  it("marks decades by years", () => {
    const ticks = timeTicks(day(2000, 1, 1), day(2026, 1, 1), { interval: "year" });
    expect(ticks.length).toBeLessThanOrEqual(8);
    for (const tick of ticks) expect(new Date(tick.time).getFullYear() % 5).toBe(0);
  });

  it("handles a leap day and month ends", () => {
    const series = days(day(2028, 2, 20), 20);
    const ticks = timeTicks(series[0]!, series.at(-1)!, { interval: "day" });
    expect(ticks.some((tick) => new Date(tick.time).getMonth() === 2)).toBe(true);
  });
});

describe("a point written out", () => {
  it("names a day with its weekday", () => {
    expect(pointLabel(day(2026, 11, 18), "day")).toBe("Mi., 18. Nov.");
    expect(pointLabel(day(2026, 11, 18), "day", { withYear: true })).toBe("Mi., 18. Nov. 2026");
  });

  it("names a month in full", () => {
    expect(pointLabel(day(2026, 11, 1), "month")).toBe("November 2026");
  });
});

describe("where summer time begins at midnight", () => {
  // Cairo's clocks went from 00:00 to 01:00 on 26 April 2024: that day has no midnight.
  const zone = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "Africa/Cairo";
  });
  afterAll(() => {
    if (zone === undefined) delete process.env.TZ;
    else process.env.TZ = zone;
  });

  it("keeps marking the days after the day without a midnight", () => {
    expect(new Date(2024, 3, 26, 0).getHours()).toBe(1);
    const ticks = timeTicks(day(2024, 4, 10), day(2024, 5, 20), { interval: "day" });
    expect(ticks.map((tick) => new Date(tick.time).toLocaleDateString("en-CA"))).toEqual([
      "2024-04-15",
      "2024-05-01",
      "2024-05-15",
    ]);
  });

  it("marks the months of a range that starts on that day", () => {
    const ticks = timeTicks(day(2024, 4, 26), day(2025, 3, 1), { interval: "month" });
    expect(ticks.map((tick) => new Date(tick.time).toLocaleDateString("en-CA"))).toEqual([
      "2024-07-01",
      "2024-10-01",
      "2025-01-01",
    ]);
  });

  it("turns to that day at its first hour", () => {
    const ticks = timeTicks(day(2024, 4, 25, 20), day(2024, 4, 26, 4), { interval: "hour" });
    const turns = ticks.filter((tick) => tick.turn).map((tick) => new Date(tick.time));
    expect(turns.map((date) => [date.getDate(), date.getHours()])).toEqual([[26, 1]]);
  });
});
