import type { ComponentProps, CSSProperties } from "react";

import { chartFormat } from "@/internal/chart/format";
import { lane, laneAt } from "@/internal/chart/lane";
import { share, valueAxis } from "@/internal/chart/scale";
import { fillStyle, troughFill } from "@/internal/trough";
import { cn } from "@/lib/cn";

export type BulletItem = {
  /** What is measured against its goal: „Umsatz im November“. */
  name: string;
  /** Where it stands. */
  value: number;
  /** The goal: a tick across the bar. */
  target?: number;
  /**
   * Where „schwach“ ends and „gut“ begins, as two amounts: the quiet bands behind the bar,
   * darker where it is poor. Left out, the track is one even band.
   */
  bands?: [poor: number, good: number];
  /** The end of the scale; a round number past the value, the goal and the bands when left out. */
  max?: number;
  /** How this row's amounts are written, if they differ from the list's (hours beside euros). */
  format?: Intl.NumberFormatOptions;
  /** Stays the same while the numbers change; the name when left out. */
  key?: string;
};

export type BulletProps = Omit<ComponentProps<"ul">, "children"> & {
  data: readonly BulletItem[];
  /** How amounts are written, as `Intl.NumberFormat` options. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** The word between a value and its goal: „38.400 € von 50.000 €“. */
  of?: string;
  /** What a share of the goal is called, after it: „77 % vom Ziel“. */
  ofTarget?: string;
  /** `neutral` measures in the text colour; `accent` is Indigo, for the one goal a view is about. */
  tone?: "neutral" | "accent";
  /** Whether the bars grow out of their baseline one after the other where it first shows. */
  drawIn?: boolean;
};

/**
 * Goals and where they stand: a month's revenue against its target, hours against a budget. A
 * row per goal, compact: a thin bar for the value, a tick across it for the goal, and quiet
 * bands behind it for poor, fair and good, darker where it is poor. The figures beside the name
 * say it in words, so neither the bands nor a colour has to.
 *
 * Each row keeps its own scale (goals of different size stand together); name the list with an
 * `aria-label`. Plain markup and server-safe.
 */
export function Bullet({
  data,
  format,
  locale = "de-DE",
  of = "von",
  ofTarget = "vom Ziel",
  tone = "neutral",
  drawIn = true,
  className,
  ...props
}: BulletProps) {
  return (
    <ul
      data-slot="bullet"
      className={cn("@container flex min-w-0 flex-col gap-5", className)}
      {...props}
    >
      {data.map((item, index) => {
        const numbers = chartFormat(locale, item.format ?? format);
        // A tenth past the largest amount, so a goal at the end of the scale still shows whole.
        // An amount that is no number (`NaN`) takes no part in the scale and stands at its start.
        const amounts = [item.value, item.target ?? 0, ...(item.bands ?? [])].filter(
          Number.isFinite,
        );
        const end =
          item.max ??
          valueAxis([0, Math.max(0, ...amounts) * 1.1], {
            count: 4,
          }).domain[1];
        const domain: [number, number] = [0, end > 0 ? end : 1];
        const at = (amount: number) =>
          Number.isFinite(amount) ? Math.min(1, Math.max(0, share(amount, domain))) : 0;
        const reached = item.target ? item.value / item.target : null;
        return (
          <li
            key={item.key ?? item.name}
            data-slot="bullet-item"
            // Narrow, the figures go under the name rather than cutting it short.
            className="grid grid-cols-1 items-baseline gap-x-4 gap-y-1 text-control @[26rem]:grid-cols-[minmax(0,1fr)_auto] @[26rem]:gap-y-2"
          >
            <span className="min-w-0 truncate text-fg-body">{item.name}</span>
            <span className="whitespace-nowrap tabular-nums @[26rem]:text-right">
              <span className="text-fg">{numbers.value(item.value)}</span>
              {item.target !== undefined && (
                <span className="text-fg-muted">
                  {" "}
                  {of} {numbers.value(item.target)}
                  {reached !== null && (
                    <>
                      {" · "}
                      {numbers.share(reached)} {ofTarget}
                    </>
                  )}
                </span>
              )}
            </span>

            {/* The scale runs 4px inside the track's ends, so the value's round cap sits in the
                track's round end, centred on the same point (Justin, 2026-11-21). */}
            <span aria-hidden className="relative col-span-full block h-3">
              {/* The bands: one quiet track, the poor and fair stretches a step darker, each
                  ending round. Cut by `clip-path` to where they end on the inset scale. */}
              <span className="absolute inset-0 overflow-hidden rounded-full bg-fg/5">
                {item.bands && (
                  <>
                    <span
                      className="absolute inset-0 bg-fg/8"
                      style={{ clipPath: bandEnd(at(item.bands[1])) }}
                    />
                    <span
                      className="absolute inset-0 bg-fg/10"
                      style={{ clipPath: bandEnd(at(item.bands[0])) }}
                    />
                  </>
                )}
              </span>
              {/* The value: a thinner bar in the middle of the track. */}
              <span className="absolute inset-x-1 top-1/2 block h-1 -translate-y-1/2 overflow-hidden rounded-full">
                <span
                  className={cn(
                    "absolute inset-0 block",
                    troughFill,
                    "transition-[translate] spring-glide motion-reduce:transition-none",
                    tone === "accent" ? "bg-accent" : "bg-fg",
                    drawIn && "chart-grow",
                  )}
                  style={
                    { ...fillStyle(at(item.value)), "--chart-grow-index": index } as CSSProperties
                  }
                />
              </span>
              {/* The goal: a tick across the track, taller than it. */}
              {item.target !== undefined && (
                <span className="absolute inset-x-1 inset-y-0">
                  <span className={lane} style={laneAt(at(item.target))}>
                    <span className="absolute -top-1 right-0 -bottom-1 w-0.5 translate-x-1/2 rounded-full bg-fg" />
                  </span>
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The cut of a band that ends at `at` of the scale, which runs 4px inside the track's ends. Its
 * end is round like the track's (Justin, 2026-11-21).
 */
function bandEnd(at: number) {
  return `inset(0 calc(4px + ${Math.round((1 - at) * 10000) / 10000} * (100% - 8px)) 0 0 round 999px)`;
}
