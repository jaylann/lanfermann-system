import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * A whole number whose digits roll to their new value instead of being swapped: each place is
 * a column of the ten digits behind a window one line tall, and the column is moved by
 * `translate` on `settle`. Tabular digits keep every column the same width, so nothing beside
 * the number shifts while it changes.
 *
 * Assistive tech reads the plain number; the columns are hidden from it. Under reduced motion
 * the digits change at once. It does not roll when it first shows: page load does not animate.
 *
 * Internal for now: the count of an `ActionBar`. Formats (grouping, currency) and a public
 * `RollingNumber` are planned with the dashboard parts.
 */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const digits = String(Math.max(0, Math.trunc(value))).split("");
  return (
    <span data-slot="rolling-number" className={cn("inline-flex tabular-nums", className)}>
      <span className="sr-only">{value}</span>
      {/* `items-start`: a column keeps its own height, ten lines. Stretched to the window's one
          line, a tenth of it would be a tenth of a line and the digits would not roll. */}
      <span aria-hidden className="inline-flex h-[1lh] items-start overflow-hidden">
        {digits.map((digit, index) => (
          <span
            // Counted from the right: the ones stay the ones when a digit joins at the front.
            key={digits.length - index}
            style={{ "--roll": `${Number(digit) * -10}%` } as CSSProperties}
            // A place that joins (9 becomes 10) fades in; it has nothing to roll from.
            className="flex translate-y-(--roll) flex-col transition-[translate,opacity] spring-settle motion-reduce:transition-none starting:opacity-0"
          >
            {DIGITS.map((each) => (
              <span key={each} className="h-[1lh]">
                {each}
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}
