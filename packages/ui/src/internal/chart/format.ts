import { numberFormat } from "@/internal/number-places";

/**
 * How a chart writes its numbers: in full where one value is read (a readout, a bar's end, the
 * table), compact where many stand in a row (an axis: „15.000 €“, „1,5 Mio. €“). German by
 * default, and never "-0". Server-safe.
 */
export type ChartFormat = {
  /** A value read on its own. */
  value: (value: number) => string;
  /** A line of an axis. */
  axis: (value: number) => string;
  /** A share of a whole, „38 %“. */
  share: (value: number) => string;
};

/**
 * How a line of an axis writes its number: compact, at most one decimal, and always grouped
 * (German groups four digits only in compact form, „8000“ beside „15.000“).
 */
export function axisOptions(options: Intl.NumberFormatOptions = {}): Intl.NumberFormatOptions {
  return {
    ...options,
    notation: "compact",
    useGrouping: "always",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  };
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
  const compact = numberFormat(locale, axisOptions(options));
  const percent = numberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const format: ChartFormat = {
    value: (value) => full.format(value),
    axis: (value) => compact.format(value),
    share: (value) => percent.format(value),
  };
  cache.set(key, format);
  return format;
}
