import { numberFormat } from "@/internal/number-places";

/**
 * Steps and changes: the maths of a `Waterfall` (a result built from gains and losses) and a
 * `Dumbbell` (a value before and after), and the signed figures both write. Pure and
 * server-safe.
 */

export type WaterfallStep = {
  name: string;
  /** A gain (positive) or a loss (negative). Ignored on a total, which shows the sum so far. */
  value: number;
  /** A sum so far, standing from zero: „Ergebnis“, „Q1“. */
  kind?: "total";
};

export type WaterfallBar = {
  /** Where the column begins: the running sum before the step, or zero for a total. */
  start: number;
  /** Where it ends: the running sum after the step. */
  end: number;
  /** What the step adds (negative for a loss); for a total, the sum itself. */
  change: number;
  /** The running sum after the step. */
  running: number;
  total: boolean;
};

const finite = (value: number) => (Number.isFinite(value) ? value : 0);

/**
 * The columns of a waterfall: each step floats from the running sum before it to the sum after
 * it, and a total stands from zero to the sum so far. A value that is not a number adds nothing.
 */
export function waterfallBars(steps: readonly WaterfallStep[]): WaterfallBar[] {
  return steps.reduce<WaterfallBar[]>((bars, step) => {
    const running = bars.at(-1)?.running ?? 0;
    if (step.kind === "total") {
      return [...bars, { start: 0, end: running, change: running, running, total: true }];
    }
    const change = finite(step.value);
    return [
      ...bars,
      { start: running, end: running + change, change, running: running + change, total: false },
    ];
  }, []);
}

/**
 * The change from one value to another as a share of the first: 95 → 105 is +0.105. From a
 * negative value the share is taken of its size, so going from −10 to −5 is a rise (+0.5).
 * From zero there is no share to give (`null`), unless nothing changed (0).
 */
export function relativeChange(from: number, to: number): number | null {
  if (from === to) return 0;
  if (from === 0 || !Number.isFinite(from) || !Number.isFinite(to)) return null;
  return (to - from) / Math.abs(from);
}

/**
 * A figure with its sign written out: „+12.400 €“, „−3.100 €“ (the typographic minus), and
 * „±0 €“ for what rounds to nothing, so the direction is said in the figure and never left to a
 * colour.
 */
export function signedFormat(
  locale: Intl.LocalesArgument = "de-DE",
  options: Intl.NumberFormatOptions = {},
): (value: number) => string {
  const signed = numberFormat(locale, { ...options, signDisplay: "exceptZero" });
  const bare = numberFormat(locale, { ...options, signDisplay: "never" });
  return (value) => {
    const text = signed.format(value);
    // A value that rounds to zero carries no sign in `exceptZero`: say it is neither way.
    if (!/[+\-−]/.test(text)) return `±${bare.format(0)}`;
    return text.replace("-", "−");
  };
}
