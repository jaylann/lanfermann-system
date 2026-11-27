import { numberFormat } from "@/internal/number-places";

/**
 * How a chart writes its numbers: in full where one value is read (a readout, a bar's end, the
 * table), compact where many stand in a row (an axis: „15.000 €“, „1,5 Mio. €“). German by
 * default, and never "-0". Server-safe.
 */
export type ChartFormat = {
  /** A value read on its own. */
  value: (value: number) => string;
  /**
   * How the lines of one axis are written, given all of them: the lines decide the decimals
   * together (`axisDigits`), so a quarter step reads „0,25“ and not „0,3“.
   */
  axisFor: (ticks: readonly number[]) => (value: number) => string;
  /** A share of a whole, „38 %“. */
  share: (value: number) => string;
};

/**
 * The most decimals an axis is asked for. Three covers every step down to 0.001 and a quarter
 * of a compact unit („1,25 Mio.“); it also is what keeps float noise (0.30000000000000004) out
 * of the count.
 */
const MOST_DIGITS = 3;

/**
 * Whether every line of an axis shows the same number of decimals („0,00 $ · 0,25 $ · 0,50 $“)
 * instead of only the ones it needs („0 $ · 0,25 $ · 0,5 $“). Off: the short form is the calmer
 * column, and a compact axis would otherwise read „500.000,0 · 1,0 Mio.“.
 */
const SAME_DIGITS_ON_EVERY_LINE = false;

function compact(
  options: Intl.NumberFormatOptions,
  most: number,
  least: number,
): Intl.NumberFormatOptions {
  return {
    ...options,
    notation: "compact",
    useGrouping: "always",
    maximumFractionDigits: most,
    minimumFractionDigits: least,
  };
}

/**
 * How many decimals the lines of an axis need so each says its own value: the longest fraction
 * among them, read from their compact form. That is right in any locale and unit, because it is
 * the written label that is measured, not the step: 0.25 needs two, 2.5 one, 25 none, a percent
 * of 0.025 one („2,5 %“) and 1 250 000 two („1,25 Mio.“).
 */
export function axisDigits(
  ticks: readonly number[],
  locale: Intl.LocalesArgument = "de-DE",
  options: Intl.NumberFormatOptions = {},
): number {
  const probe = numberFormat(locale, compact(options, MOST_DIGITS, 0));
  let digits = 0;
  for (const tick of ticks) {
    if (!Number.isFinite(tick)) continue;
    for (const part of probe.formatToParts(tick)) {
      // Counted in characters, not code units: not every numbering system fits in one.
      if (part.type === "fraction") digits = Math.max(digits, [...part.value].length);
    }
  }
  return digits;
}

/**
 * How a line of an axis writes its number, given all the lines of that axis: compact, with the
 * decimals its lines need (`axisDigits`), and always grouped (German groups four digits only in
 * compact form, „8000“ beside „15.000“). The caller's own fraction digits do not apply to an
 * axis: they are for a value read on its own.
 */
export function axisOptions(
  options: Intl.NumberFormatOptions = {},
  ticks: readonly number[] = [],
  locale: Intl.LocalesArgument = "de-DE",
): Intl.NumberFormatOptions {
  const digits = axisDigits(ticks, locale, options);
  return compact(options, digits, SAME_DIGITS_ON_EVERY_LINE ? digits : 0);
}

const cache = new Map<string, ChartFormat>();

export function chartFormat(
  locale: Intl.LocalesArgument = "de-DE",
  options: Intl.NumberFormatOptions = {},
): ChartFormat {
  const key = JSON.stringify([locale, options]);
  const found = cache.get(key);
  if (found) return found;
  const full = numberFormat(locale, options);
  const percent = numberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const format: ChartFormat = {
    value: (value) => full.format(value),
    // Nothing is kept per set of lines: the format behind it is the cached one of its options.
    axisFor: (ticks) => {
      const axis = numberFormat(locale, axisOptions(options, ticks, locale));
      return (value) => axis.format(value);
    },
    share: (value) => percent.format(value),
  };
  cache.set(key, format);
  return format;
}
