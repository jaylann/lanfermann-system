import { describe, expect, it } from "vitest";

import { mergePlaces, nextRolls, numberFormat, type Place, toPlaces } from "./number-places";

const keys = (places: readonly Place[]) => places.map((place) => place.key);
const de = numberFormat();

describe("toPlaces", () => {
  it("counts the integer places from the decimal point", () => {
    expect(keys(toPlaces(de, 999).places)).toEqual(["i2", "i1", "i0"]);
    expect(keys(toPlaces(de, 1000).places)).toEqual(["i3", "g3", "i2", "i1", "i0"]);
    expect(toPlaces(de, 1000).text).toBe("1.000");
  });

  it("names each group separator by the places to its right", () => {
    expect(keys(toPlaces(de, 1_234_567).places)).toEqual([
      "i6",
      "g6",
      "i5",
      "i4",
      "i3",
      "g3",
      "i2",
      "i1",
      "i0",
    ]);
    const lakh = numberFormat("en-IN");
    expect(toPlaces(lakh, 1_234_567).text).toBe("12,34,567");
    expect(keys(toPlaces(lakh, 1_234_567).places).filter((key) => key[0] === "g")).toEqual([
      "g5",
      "g3",
    ]);
  });

  it("keeps the currency and the no-break space before it as one run after the digits", () => {
    const euro = numberFormat("de-DE", { style: "currency", currency: "EUR" });
    const { places, text, unit } = toPlaces(euro, -1234.5);
    expect(text).toBe("-1.234,50 €");
    expect(keys(places)).toEqual([
      "minus",
      "i3",
      "g3",
      "i2",
      "i1",
      "i0",
      "decimal",
      "f1",
      "f2",
      "post",
    ]);
    expect(places.at(-1)).toEqual({ key: "post", kind: "symbol", text: " €" });
    expect(unit).toBe("| €");
  });

  it("reads the digits of a percentage", () => {
    const percent = numberFormat("de-DE", { style: "percent", maximumFractionDigits: 1 });
    const { places, text } = toPlaces(percent, 0.125);
    expect(text).toBe("12,5 %");
    expect(places.filter((place) => place.kind === "digit").map((place) => place.digit)).toEqual([
      1, 2, 5,
    ]);
  });

  it("never shows a minus for a value that rounds to zero", () => {
    expect(toPlaces(numberFormat("de-DE", { maximumFractionDigits: 0 }), -0.2).text).toBe("0");
  });

  it("puts a compact unit after the digits and changes the unit with it", () => {
    const compact = numberFormat("de-DE", { notation: "compact" });
    expect(toPlaces(compact, 12_345).unit).toBe("|");
    expect(toPlaces(compact, 1_234_567).text).toBe("1,2 Mio.");
    expect(toPlaces(compact, 1_234_567).unit).toBe("| Mio.");
  });

  it("reads the digits of another numbering system", () => {
    const arabic = numberFormat("ar-EG");
    const digits = toPlaces(arabic, 507)
      .places.filter((place) => place.kind === "digit")
      .map((place) => place.digit);
    expect(digits).toEqual([5, 0, 7]);
  });

  it("stands still for a value that is not a number", () => {
    expect(toPlaces(de, Number.NaN).places).toEqual([{ key: "pre", kind: "symbol", text: "NaN" }]);
  });
});

describe("nextRolls", () => {
  const digits = (value: number) => toPlaces(de, value).places;

  it("starts a new place at its digit", () => {
    expect(nextRolls({}, digits(907), 1)).toEqual({ i2: 9, i1: 0, i0: 7 });
  });

  it("rolls forward when the number grows, through 0", () => {
    expect(nextRolls({ i0: 9 }, [{ key: "i0", kind: "digit", digit: 0 }], 1)).toEqual({ i0: 10 });
    expect(nextRolls({ i0: 8 }, [{ key: "i0", kind: "digit", digit: 1 }], 1)).toEqual({ i0: 11 });
  });

  it("rolls back when the number shrinks", () => {
    expect(nextRolls({ i0: 0 }, [{ key: "i0", kind: "digit", digit: 9 }], -1)).toEqual({ i0: -1 });
    expect(nextRolls({ i0: 11 }, [{ key: "i0", kind: "digit", digit: 8 }], -1)).toEqual({ i0: 8 });
  });

  it("leaves a digit that did not change where it stands", () => {
    expect(nextRolls({ i1: 23, i0: 4 }, digits(35), 1)).toEqual({ i1: 23, i0: 5 });
  });

  it("takes a second change from the last target, in either direction", () => {
    const first = nextRolls({ i0: 8 }, digits(1), 1);
    expect(first.i0).toBe(11);
    expect(nextRolls(first, digits(4), 1).i0).toBe(14);
    expect(nextRolls(first, digits(9), -1).i0).toBe(9);
  });
});

describe("mergePlaces", () => {
  it("keeps a place that left where it stood", () => {
    const before = mergePlaces([], toPlaces(de, 1000).places);
    const after = mergePlaces(before, toPlaces(de, 999).places);
    expect(after.map((place) => `${place.key}${place.leaving ? "-" : ""}`)).toEqual([
      "i3-",
      "g3-",
      "i2",
      "i1",
      "i0",
    ]);
  });

  it("brings a leaving place back instead of adding it again", () => {
    const leaving = mergePlaces(mergePlaces([], toPlaces(de, -5).places), toPlaces(de, 5).places);
    expect(leaving.find((place) => place.key === "minus")?.leaving).toBe(true);
    const back = mergePlaces(leaving, toPlaces(de, -6).places);
    expect(back.map((place) => place.key)).toEqual(["minus", "i0"]);
    expect(back.every((place) => !place.leaving)).toBe(true);
  });
});
