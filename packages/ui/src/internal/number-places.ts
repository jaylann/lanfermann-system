/**
 * A formatted number taken apart into places, for a `RollingNumber`: each digit is a place that
 * rolls, everything else (the minus, group separators, the decimal sign, a currency, a percent
 * sign, a compact unit, the no-break space before them) is a place that stands.
 *
 * Every place has a key that keeps its meaning while the number changes: digits are counted
 * from the decimal point, so the ones stay the ones when 999 becomes 1.000, and a separator is
 * named by the place on its left. What comes before and after the digits is one run each.
 *
 * Pure and server-safe; the rolling itself is CSS (`rolling-number.css`).
 */

export type Place =
  { key: string; kind: "digit"; digit: number } | { key: string; kind: "symbol"; text: string };

export type NumberPlaces = {
  /** The whole formatted value, as assistive tech reads it. */
  text: string;
  places: Place[];
  /**
   * What stands around the digits (currency, unit, compact suffix). When it changes, the
   * number is a different kind of figure and is swapped, not rolled.
   */
  unit: string;
};

const BODY = new Set(["integer", "group", "decimal", "fraction"]);

/**
 * The number format for a `RollingNumber`: German by default, and a minus only where there is
 * something below zero (`signDisplay: "negative"`), so a value rounding to zero is never "-0".
 */
export function numberFormat(
  locale: Intl.LocalesArgument = "de-DE",
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { signDisplay: "negative", ...options });
}

export function toPlaces(format: Intl.NumberFormat, value: number): NumberPlaces {
  const parts = format.formatToParts(value);
  const text = parts.map((part) => part.value).join("");
  const first = parts.findIndex((part) => BODY.has(part.type));
  if (first === -1) {
    // Not a finite number ("NaN", "∞"): one place that stands.
    return { text, places: [{ key: "pre", kind: "symbol", text }], unit: text };
  }
  let last = first;
  for (let index = first; index < parts.length; index++) {
    if (BODY.has(parts[index]!.type)) last = index;
  }

  const places: Place[] = [];
  let unit = "";

  // Before the digits: the minus is a place of its own (it comes and goes); the rest is a run.
  let run = "";
  let runs = 0;
  const flush = () => {
    if (run) places.push({ key: runs++ === 0 ? "pre" : "pre2", kind: "symbol", text: run });
    unit += run;
    run = "";
  };
  for (const part of parts.slice(0, first)) {
    if (part.type === "minusSign") {
      flush();
      places.push({ key: "minus", kind: "symbol", text: part.value });
    } else {
      run += part.value;
    }
  }
  flush();

  // The digits, counted from the decimal point, in the format's own numbering system.
  const zero = zeroOf(format);
  const digitOf = (character: string) => (character.codePointAt(0) ?? zero) - zero;
  const body = parts.slice(first, last + 1);
  let integers = body
    .filter((part) => part.type === "integer")
    .reduce((count, part) => count + part.value.length, 0);
  let fractions = 0;
  for (const part of body) {
    if (part.type === "integer") {
      for (const character of part.value) {
        integers -= 1;
        places.push({ key: `i${integers}`, kind: "digit", digit: digitOf(character) });
      }
    } else if (part.type === "group") {
      places.push({ key: `g${integers}`, kind: "symbol", text: part.value });
    } else if (part.type === "decimal") {
      places.push({ key: "decimal", kind: "symbol", text: part.value });
    } else if (part.type === "fraction") {
      for (const character of part.value) {
        fractions += 1;
        places.push({ key: `f${fractions}`, kind: "digit", digit: digitOf(character) });
      }
    }
  }

  // After the digits: one run (a no-break space and the currency, the percent sign, a unit).
  const after = parts
    .slice(last + 1)
    .map((part) => part.value)
    .join("");
  if (after) places.push({ key: "post", kind: "symbol", text: after });
  unit += `|${after}`;

  return { text, places, unit };
}

/** The code point of the format's zero: digits of every numbering system run on from it. */
function zeroOf(format: Intl.NumberFormat): number {
  const zero = format.formatToParts(0).find((part) => part.type === "integer")?.value;
  return zero?.codePointAt(0) ?? 48;
}

/**
 * Where each digit place's column stands after a change: a position that only ever grows when
 * the number grows and shrinks when it shrinks, so every column rolls the way the number moves
 * (an odometer: 19 → 20 rolls the ones forward through 0). The digit shown is the position
 * modulo ten. A place that is new starts at its digit; it fades in and does not roll.
 *
 * Worked out from the last target, never from what is on screen, so a change that arrives
 * while the columns still move simply sets a new target.
 */
export function nextRolls(
  rolls: Readonly<Record<string, number>>,
  places: readonly Place[],
  direction: number,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const place of places) {
    if (place.kind !== "digit") continue;
    const before = rolls[place.key];
    if (before === undefined) {
      next[place.key] = place.digit;
      continue;
    }
    const shown = ((before % 10) + 10) % 10;
    const step =
      direction < 0 ? -((shown - place.digit + 10) % 10) : (place.digit - shown + 10) % 10;
    next[place.key] = before + step;
  }
  return next;
}

/** A place on screen: one of the value's, or one that has just left and is on its way out. */
export type ShownPlace = Place & { leaving: boolean };

/** Left to right: what comes before, the integer places from the highest, the fraction. */
function rank(key: string): number {
  if (key === "pre") return 0;
  if (key === "minus") return 1;
  if (key === "pre2") return 2;
  if (key === "decimal") return 50_000;
  if (key === "post") return 90_000;
  const n = Number(key.slice(1));
  if (key[0] === "i") return 10 + (10_000 - n) * 2;
  if (key[0] === "g") return 10 + (10_000 - n) * 2 + 1;
  return 50_000 + n;
}

/**
 * The places to draw: the value's own, and those of the previous drawing that the value no
 * longer has, kept where they stood and marked as leaving. A leaving place that the value has
 * again comes back as it is (it reverses instead of entering anew).
 */
export function mergePlaces(shown: readonly ShownPlace[], places: readonly Place[]): ShownPlace[] {
  const keys = new Set(places.map((place) => place.key));
  const merged: ShownPlace[] = places.map((place) => ({ ...place, leaving: false }));
  for (const place of shown) {
    if (!keys.has(place.key)) merged.push({ ...place, leaving: true });
  }
  return merged.sort((a, b) => rank(a.key) - rank(b.key));
}
