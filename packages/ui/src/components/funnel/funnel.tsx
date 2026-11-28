import type { ComponentProps, CSSProperties } from "react";

import { chartFormat, shareOptions } from "@/internal/chart/format";
import { fillStyle, troughFill } from "@/internal/trough";
import { cn } from "@/lib/cn";
import { Localized, LocalizedNumber } from "@/locale/localized";

export type FunnelStep = {
  /** What happens at the step: „Angebot gesendet“. */
  name: string;
  /** How many reached it. */
  value: number;
  /** Stays the same while the numbers change; the name when left out. */
  key?: string;
};

export type FunnelProps = Omit<ComponentProps<"ol">, "children"> & {
  /** The steps in their order, the widest first. */
  data: readonly FunnelStep[];
  /** How the counts are written, as `Intl.NumberFormat` options. */
  format?: Intl.NumberFormatOptions;
  /**
   * The locale the counts are written with. Left out, it is the one of the nearest
   * `LocaleProvider` (`de-DE` without one).
   */
  locale?: string;
  /**
   * What each step's rate is measured against: the step before (`previous`, the default: where
   * the flow loses people) or the first step (`first`: how many of all get this far).
   */
  rate?: "previous" | "first";
  /** The words a screen reader hears after a rate. */
  rateLabels?: { previous: string; first: string };
  /** `neutral` measures in the text colour; `accent` is Indigo, for the one flow a view is about. */
  tone?: "neutral" | "accent";
  /** Whether the bars grow out of their baseline one after the other where it first shows. */
  drawIn?: boolean;
};

/**
 * A flow and what it loses on the way: quotes written, sent, opened, accepted. A row per step,
 * its count and the share that came on from the step before; its bar is as long as its share
 * of the first step, and the faint bar behind it is the step before, so what was lost between
 * two steps is the gap between the two. One hue: the steps are one flow.
 *
 * Name it with an `aria-label`; it is an ordered list, read step by step. Plain markup and
 * server-safe: bars are fills pushed by `translate` and grow in by CSS.
 */
export function Funnel({
  data,
  format,
  locale,
  rate = "previous",
  rateLabels,
  tone = "neutral",
  drawIn = true,
  className,
  ...props
}: FunnelProps) {
  // With a locale of its own the figures are written here; without one a client leaf writes
  // them in the provider's, which this server-safe file cannot read.
  const numbers = locale === undefined ? null : chartFormat(locale, format);
  const first = Math.max(0, data[0]?.value ?? 0);
  const fill = tone === "accent" ? "bg-accent" : "bg-fg";
  const ghost = tone === "accent" ? "bg-accent/20" : "bg-fg/12";

  return (
    <ol data-slot="funnel" className={cn("flex min-w-0 flex-col gap-4", className)} {...props}>
      {data.map((step, index) => {
        const before = index > 0 ? Math.max(0, data[index - 1]!.value) : null;
        const value = Math.max(0, step.value);
        const share = first > 0 ? value / first : 0;
        const against = rate === "first" ? first : before;
        const kept = against !== null && against > 0 ? value / against : null;
        const bar = (fraction: number, kind: string, extra?: CSSProperties) => (
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 block",
              troughFill,
              "transition-[translate] spring-glide motion-reduce:transition-none",
              drawIn && "chart-grow",
              kind,
            )}
            style={{ ...fillStyle(fraction), ...extra }}
          />
        );
        return (
          <li
            key={step.key ?? step.name}
            data-slot="funnel-step"
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-4 gap-y-1.5 text-control"
          >
            <span className="min-w-0 truncate text-fg-body">{step.name}</span>
            <span className="text-right whitespace-nowrap text-fg tabular-nums">
              {numbers ? (
                numbers.value(step.value)
              ) : (
                <LocalizedNumber value={step.value} options={format} />
              )}
            </span>
            <span className="w-[4ch] text-right whitespace-nowrap text-fg-muted tabular-nums">
              {kept !== null && index > 0 ? (
                <>
                  {numbers ? (
                    numbers.share(kept)
                  ) : (
                    <LocalizedNumber value={kept} options={shareOptions} />
                  )}
                  <span className="sr-only">
                    {" "}
                    {rateLabels?.[rate] ?? (
                      <Localized
                        ns="charts"
                        name={rate === "first" ? "rateFirst" : "ratePrevious"}
                      />
                    )}
                  </span>
                </>
              ) : null}
            </span>
            {/* The step before, faint, and this step over it: the gap is what was lost. */}
            <span
              aria-hidden
              className="relative col-span-full block h-2 overflow-hidden rounded-full"
            >
              {before !== null &&
                bar(first > 0 ? before / first : 0, ghost, {
                  "--chart-grow-index": index - 1,
                } as CSSProperties)}
              {bar(share, fill, { "--chart-grow-index": index } as CSSProperties)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
