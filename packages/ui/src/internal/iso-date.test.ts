import { describe, expect, it } from "vitest";

import {
  formatGermanDate,
  formatGermanMoment,
  formatGermanRange,
  formatTime,
  isIsoTime,
  outsideLimits,
  parseGermanDate,
  parseGermanMoment,
  parseGermanRange,
  parseGermanTime,
  parseIsoDate,
  parseIsoInterval,
  shiftIsoTime,
  splitIsoMoment,
  timeMatches,
  timesOfDay,
  toIsoDate,
  toIsoInterval,
  weekdayIndex,
} from "./iso-date";

const iso = (text: string, today = new Date(2026, 10, 14)) => {
  const date = parseGermanDate(text, today);
  return date ? toIsoDate(date) : undefined;
};

describe("ISO dates", () => {
  it("round-trips a date without shifting it by a time zone", () => {
    expect(toIsoDate(parseIsoDate("2026-11-14")!)).toBe("2026-11-14");
    expect(toIsoDate(parseIsoDate("2026-01-01")!)).toBe("2026-01-01");
    expect(toIsoDate(parseIsoDate("2024-02-29")!)).toBe("2024-02-29");
  });

  it("rejects what is not a real ISO date", () => {
    for (const value of ["", "14.11.2026", "2026-11-31", "2026-02-30", "2026-13-01", "26-11-14"]) {
      expect(parseIsoDate(value), value).toBeUndefined();
    }
    expect(parseIsoDate(undefined)).toBeUndefined();
    expect(parseIsoDate(null)).toBeUndefined();
  });

  it("formats the German way", () => {
    expect(formatGermanDate(new Date(2026, 1, 3))).toBe("03.02.2026");
  });
});

describe("typed German dates", () => {
  it.each([
    ["14.11.2026", "2026-11-14"],
    ["14.11.26", "2026-11-14"],
    ["1.2.2026", "2026-02-01"],
    ["01. 02. 2026", "2026-02-01"],
    ["14.11.", "2026-11-14"],
    ["14112026", "2026-11-14"],
    ["141126", "2026-11-14"],
    ["2026-11-14", "2026-11-14"],
    ["  30.11.2026 ", "2026-11-30"],
  ])("reads %s", (typed, expected) => {
    expect(iso(typed)).toBe(expected);
  });

  it.each(["", "morgen", "31.11.2026", "30.02.2026", "14.13.2026", "14/11/2026", "14.11.202"])(
    "does not read %s",
    (typed) => {
      expect(iso(typed)).toBeUndefined();
    },
  );
});

const TODAY = new Date(2026, 10, 14);

describe("typed times", () => {
  it.each([
    ["9", "09:00"],
    ["09", "09:00"],
    ["9:30", "09:30"],
    ["9.30", "09:30"],
    ["930", "09:30"],
    ["0930", "09:30"],
    ["1745", "17:45"],
    ["9 Uhr", "09:00"],
    ["9:30 Uhr", "09:30"],
    ["17h", "17:00"],
    ["17h30", "17:30"],
    [" 23:59 ", "23:59"],
    ["0", "00:00"],
  ])("reads %s", (typed, expected) => {
    expect(parseGermanTime(typed)).toBe(expected);
  });

  it.each(["", "24:00", "9:60", "25", "abends", "9:3", "12345", "9:30:00"])(
    "does not read %s",
    (typed) => {
      expect(parseGermanTime(typed)).toBeUndefined();
    },
  );

  it("knows an ISO time from anything else", () => {
    expect(isIsoTime("09:30")).toBe(true);
    for (const value of ["9:30", "24:00", "09:60", "", undefined, null]) {
      expect(isIsoTime(value), String(value)).toBe(false);
    }
  });

  it("steps a time and stays within the day", () => {
    expect(shiftIsoTime("09:00", 15)).toBe("09:15");
    expect(shiftIsoTime("09:00", -15)).toBe("08:45");
    expect(shiftIsoTime("23:50", 15)).toBe("00:05");
    expect(shiftIsoTime("00:05", -15)).toBe("23:50");
  });
});

describe("a date with a time", () => {
  it("splits and formats the ISO form", () => {
    expect(splitIsoMoment("2026-11-14T09:30")).toEqual({ date: "2026-11-14", time: "09:30" });
    expect(splitIsoMoment("2026-11-14")).toEqual({ date: "2026-11-14", time: "" });
    for (const value of ["", "2026-11-31T09:30", "2026-11-14T24:00", "09:30", undefined]) {
      expect(splitIsoMoment(value), String(value)).toBeUndefined();
    }
    // A "T" with no time after it, or with more than a time: not a moment, and not passed on.
    for (const value of ["2026-11-14T", "2026-11-14T09:30T10:00", "2026-11-14T09:30T"]) {
      expect(splitIsoMoment(value), value).toBeUndefined();
    }
    expect(parseIsoInterval("2026-11-14T/2026-11-30")).toEqual({ from: "", to: "" });
    expect(formatGermanMoment("2026-11-14T09:30")).toBe("14.11.2026, 09:30");
    expect(formatGermanMoment("2026-11-14")).toBe("14.11.2026");
    expect(formatGermanMoment("morgen")).toBe("");
  });

  it.each([
    ["14.11.2026, 09:30", "2026-11-14", "09:30"],
    ["14.11.2026 9:30", "2026-11-14", "09:30"],
    ["14.11. 9 Uhr", "2026-11-14", "09:00"],
    ["14.11.2026 um 9:30", "2026-11-14", "09:30"],
    ["14.11., 17", "2026-11-14", "17:00"],
    ["14.11. 09:30", "2026-11-14", "09:30"],
    ["14.11. 0930", "2026-11-14", "09:30"],
    ["14.11. 18", "2026-11-14", "18:00"],
    ["141126 9:30", "2026-11-14", "09:30"],
    ["2026-11-14T09:30", "2026-11-14", "09:30"],
    // No time typed: the date alone.
    ["14.11.2026", "2026-11-14", ""],
    ["14.11. 2026", "2026-11-14", ""],
    ["14.11.18", "2018-11-14", ""],
  ])("reads %s", (typed, date, time) => {
    expect(parseGermanMoment(typed, TODAY)).toEqual({ date, time });
  });

  it.each(["", "9:30", "14.11.2026, 25:00", "31.11.2026 9:30", "morgen um 9"])(
    "does not read %s",
    (typed) => {
      expect(parseGermanMoment(typed, TODAY)).toBeUndefined();
    },
  );
});

describe("typed ranges", () => {
  const range = (typed: string) => {
    const read = parseGermanRange(typed, TODAY);
    if (!read) return undefined;
    const iso = (end: { date: string; time: string }) =>
      end.time ? `${end.date}T${end.time}` : end.date;
    return `${iso(read.from)}/${iso(read.to)}`;
  };

  it.each([
    ["14.11.2026 – 30.11.2026", "2026-11-14/2026-11-30"],
    ["14.11. – 30.11.2026", "2026-11-14/2026-11-30"],
    ["14.11.-30.11.", "2026-11-14/2026-11-30"],
    ["14.–30.11.2026", "2026-11-14/2026-11-30"],
    ["14. - 30.11.", "2026-11-14/2026-11-30"],
    ["14.11.2026 bis 30.11.2026", "2026-11-14/2026-11-30"],
    ["14.11.2026-30.11.2026", "2026-11-14/2026-11-30"],
    ["2026-11-14 - 2026-11-30", "2026-11-14/2026-11-30"],
    // A start without a year or month is read so that it lies before the end.
    ["28.12. – 03.01.2027", "2026-12-28/2027-01-03"],
    ["28. – 03.01.2027", "2026-12-28/2027-01-03"],
    ["03.01. – 28.12.2027", "2027-01-03/2027-12-28"],
    // The ends come back in order.
    ["30.11.2026 – 14.11.2026", "2026-11-14/2026-11-30"],
    // With times.
    ["14.11., 9:00 – 16.11., 17:00", "2026-11-14T09:00/2026-11-16T17:00"],
    ["14.11.2026, 09:00 bis 16.11.2026, 17:00", "2026-11-14T09:00/2026-11-16T17:00"],
    ["14., 9:00 – 16.11.2026, 17:00", "2026-11-14T09:00/2026-11-16T17:00"],
    ["14.11. 9–17 Uhr", "2026-11-14T09:00/2026-11-14T17:00"],
    ["14.11.2026 9:30-11", "2026-11-14T09:30/2026-11-14T11:00"],
  ])("reads %s", (typed, expected) => {
    expect(range(typed)).toBe(expected);
  });

  it.each(["", "14.11.2026", "14.11. – morgen", "– 30.11.2026", "14.11. bis", "9–17 Uhr"])(
    "does not read %s",
    (typed) => {
      expect(range(typed)).toBeUndefined();
    },
  );
});

describe("ranges as they travel and as they are read", () => {
  it("writes a range the German way", () => {
    expect(formatGermanRange({ from: "2026-11-14", to: "2026-11-30" })).toBe(
      "14.11.2026 – 30.11.2026",
    );
    expect(formatGermanRange({ from: "2026-11-14T09:00", to: "2026-11-16T17:00" })).toBe(
      "14.11.2026, 09:00 – 16.11.2026, 17:00",
    );
    expect(formatGermanRange({ from: "", to: "" })).toBe("");
  });

  it("reads back what it wrote", () => {
    for (const range of [
      { from: "2026-11-14", to: "2026-11-30" },
      { from: "2026-11-14T09:00", to: "2026-11-16T17:00" },
      { from: "2026-12-28", to: "2027-01-03" },
    ]) {
      const read = parseGermanRange(formatGermanRange(range), TODAY)!;
      const iso = (end: { date: string; time: string }) =>
        end.time ? `${end.date}T${end.time}` : end.date;
      expect({ from: iso(read.from), to: iso(read.to) }).toEqual(range);
    }
  });

  it("submits a range as an ISO interval", () => {
    expect(toIsoInterval({ from: "2026-11-14", to: "2026-11-30" })).toBe("2026-11-14/2026-11-30");
    expect(toIsoInterval({ from: "2026-11-14", to: "" })).toBe("");
    expect(toIsoInterval(undefined)).toBe("");
    expect(parseIsoInterval("2026-11-14T09:00/2026-11-16T17:00")).toEqual({
      from: "2026-11-14T09:00",
      to: "2026-11-16T17:00",
    });
    for (const value of ["", "2026-11-14", "2026-11-14/", "a/b", undefined]) {
      expect(parseIsoInterval(value), String(value)).toEqual({ from: "", to: "" });
    }
  });

  it("says why a day lies outside the limits", () => {
    expect(outsideLimits("2026-11-20", "2026-11-14", "2026-12-31")).toBeUndefined();
    expect(outsideLimits("2026-11-20")).toBeUndefined();
    expect(outsideLimits("2026-11-01", "2026-11-14")).toBe(
      "Bitte wählen Sie ein Datum ab dem 14.11.2026.",
    );
    expect(outsideLimits("2027-01-01", undefined, "2026-12-31")).toBe(
      "Bitte wählen Sie ein Datum bis zum 31.12.2026.",
    );
    expect(outsideLimits("2027-01-01", "2026-11-14", "2026-12-31")).toBe(
      "Bitte wählen Sie ein Datum zwischen dem 14.11.2026 und dem 31.12.2026.",
    );
  });
});

describe("a range in the rows of a calendar", () => {
  const day = (iso: string) => parseIsoDate(iso)!;

  it("counts the week from Monday", () => {
    expect(weekdayIndex(day("2026-11-16"))).toBe(0); // a Monday
    expect(weekdayIndex(day("2026-11-22"))).toBe(6); // a Sunday
  });
});

describe("times to pick from", () => {
  it("lists the day in steps, within the limits", () => {
    expect(timesOfDay(15)).toHaveLength(96);
    expect(timesOfDay(15).slice(0, 3)).toEqual(["00:00", "00:15", "00:30"]);
    expect(timesOfDay(30, "08:00", "10:00")).toEqual(["08:00", "08:30", "09:00", "09:30", "10:00"]);
    expect(timesOfDay(60, "22:30")).toEqual(["23:00"]);
  });

  const found = (typed: string) => timesOfDay(15).filter((time) => timeMatches(time, typed));

  it("narrows to what the typed text could become", () => {
    expect(found("9")).toEqual(["09:00", "09:15", "09:30", "09:45"]);
    expect(found("93")).toEqual(["09:30"]);
    expect(found("9:3")).toEqual(["09:30"]);
    expect(found("14")).toEqual(["01:45", "14:00", "14:15", "14:30", "14:45"]);
    expect(found("1")).toHaveLength(4 + 40);
    expect(found("073")).toEqual(["07:30"]);
  });

  it("offers every time while no digit is typed", () => {
    expect(found("")).toHaveLength(96);
    expect(found(" Uhr")).toHaveLength(96);
  });

  it("on a 12-hour clock finds the hour in both halves of the day, or the one that is named", () => {
    const twelve = (typed: string) => timesOfDay(30).filter((time) => timeMatches(time, typed, 12));
    expect(twelve("4")).toEqual(["04:00", "04:30", "16:00", "16:30"]);
    expect(twelve("4p")).toEqual(["16:00", "16:30"]);
    expect(twelve("4:3 pm")).toEqual(["16:30"]);
    expect(twelve("12a")).toEqual(["00:00", "00:30"]);
    expect(twelve("16")).toEqual(["16:00", "16:30"]);
  });

  it("finds nothing for a time that is not on the list", () => {
    expect(found("9:1")).toEqual(["09:15"]);
    expect(found("9:2")).toEqual([]);
  });
});

describe("times with AM and PM", () => {
  it.each([
    ["9 pm", "21:00"],
    ["9:30 PM", "21:30"],
    ["9.30pm", "21:30"],
    ["930p", "21:30"],
    ["9 a.m.", "09:00"],
    ["12 AM", "00:00"],
    ["12:15 am", "00:15"],
    ["12 PM", "12:00"],
    ["11:59 p.m.", "23:59"],
  ])("reads %s", (typed, expected) => {
    expect(parseGermanTime(typed)).toBe(expected);
  });

  it.each(["13 pm", "0 am", "16:30 PM", "pm", "9:60 am"])("does not read %s", (typed) => {
    expect(parseGermanTime(typed)).toBeUndefined();
  });

  it("writes a time on either clock", () => {
    expect(formatTime("16:30")).toBe("16:30");
    expect(formatTime("16:30", 12)).toBe("4:30 PM");
    expect(formatTime("09:05", 12)).toBe("9:05 AM");
    expect(formatTime("00:00", 12)).toBe("12:00 AM");
    expect(formatTime("12:00", 12)).toBe("12:00 PM");
    expect(formatTime("", 12)).toBe("");
  });

  it("reads back what it wrote, for every quarter of an hour", () => {
    for (const time of timesOfDay(15)) {
      expect(parseGermanTime(formatTime(time, 12)), time).toBe(time);
    }
  });

  it("reads them after a date, and writes them there", () => {
    expect(parseGermanMoment("14.11.2026, 9:30 PM", TODAY)).toEqual({
      date: "2026-11-14",
      time: "21:30",
    });
    expect(parseGermanMoment("14.11. 9 pm", TODAY)).toEqual({ date: "2026-11-14", time: "21:00" });
    expect(parseGermanMoment("14.11. 2026", TODAY)).toEqual({ date: "2026-11-14", time: "" });
    expect(formatGermanMoment("2026-11-14T21:30", 12)).toBe("14.11.2026, 9:30 PM");
    expect(formatGermanRange({ from: "2026-11-14T09:00", to: "2026-11-16T17:00" }, 12)).toBe(
      "14.11.2026, 9:00 AM – 16.11.2026, 5:00 PM",
    );
  });

  it("reads them in a range", () => {
    const read = parseGermanRange("14.11.2026, 9:00 AM – 16.11.2026, 5:00 PM", TODAY)!;
    expect(read.from).toEqual({ date: "2026-11-14", time: "09:00" });
    expect(read.to).toEqual({ date: "2026-11-16", time: "17:00" });
    const oneDay = parseGermanRange("14.11. 9 am – 5 pm", TODAY)!;
    expect(oneDay.from).toEqual({ date: "2026-11-14", time: "09:00" });
    expect(oneDay.to).toEqual({ date: "2026-11-14", time: "17:00" });
  });
});
