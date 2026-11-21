"use client";

import { type ComponentProps, useLayoutEffect, useRef, useState } from "react";

import { chartFormat } from "@/internal/chart/format";
import { cn } from "@/lib/cn";

export type SegmentedBarItem = {
  name: string;
  value: number;
  /** Stays the same while the parts change; the name when left out. */
  key?: string;
};

export type SegmentedBarProps = Omit<ComponentProps<"div">, "children"> & {
  /** The parts of the whole, in the order they stand. Six at most; fold the rest into one. */
  data: readonly SegmentedBarItem[];
  /** What is split, in a few words: „Rechnungen nach Stand“. */
  label: string;
  /**
   * `thin` (8px, no text) stands beside the figures that name the parts, in a row of a table
   * or above a list. `tall` (28px) stands alone and prints each part's share inside it, where
   * it fits.
   */
  size?: "thin" | "tall";
  /** How amounts are written, as `Intl.NumberFormat` options. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** The names of the parts under the bar, with their shares. Leave it off beside a list that names them. */
  legend?: boolean;
  /** Whether the bar draws itself in from the left where it first shows. */
  drawIn?: boolean;
};

/**
 * One whole split into its parts: invoices by state, a budget by category. Each part takes its
 * share of the width in the series colours, a 2px gap between two. For parts that are compared
 * with each other, or more than six, use a `BarList`; a donut is not offered (an angle is
 * harder to read than a length).
 *
 * Pointing at a part, or its name in the legend, quiets the others. The whole split is its
 * accessible name, in words.
 */
export function SegmentedBar({
  data,
  label,
  size = "thin",
  format,
  locale = "de-DE",
  legend = true,
  drawIn = true,
  className,
  ...props
}: SegmentedBarProps) {
  const numbers = chartFormat(locale, format);
  const [active, setActive] = useState<string | null>(null);
  const bar = useRef<HTMLDivElement>(null);

  const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  type Part = {
    item: SegmentedBarItem;
    key: string;
    index: number;
    share: number;
    start: number;
    end: number;
  };
  // Each part starts where the one before it ends.
  const parts = data.reduce<Part[]>((list, item, index) => {
    const share = total > 0 ? Math.max(0, item.value) / total : 0;
    const start = list.at(-1)?.end ?? 0;
    return [...list, { item, key: item.key ?? item.name, index, share, start, end: start + share }];
  }, []);
  const drawn = parts.filter((part) => part.share > 0);
  const firstDrawn = drawn[0]?.key;
  const lastDrawn = drawn.at(-1)?.key;
  const radius = size === "tall" ? 5 : 4;
  const colorOf = (index: number) => `var(--lf-series-${Math.min(index, 5) + 1})`;
  const percent = (value: number) => `${Math.round(value * 100000) / 1000}%`;

  // A share printed in a part shows only where it fits with room on both sides; it is never
  // cut. Measured after layout and again when the bar changes its width.
  useLayoutEffect(() => {
    const box = bar.current;
    if (!box || size !== "tall") return;
    const check = () => {
      for (const text of box.querySelectorAll<HTMLElement>("[data-share]")) {
        text.dataset.fits = String(text.scrollWidth <= text.clientWidth + 0.5);
      }
    };
    check();
    const watch = new ResizeObserver(check);
    watch.observe(box);
    return () => watch.disconnect();
  }, [size, data]);

  const said = parts
    .map(
      (part) =>
        `${part.item.name} ${numbers.share(part.share)} (${numbers.value(part.item.value)})`,
    )
    .join(", ");

  return (
    <div
      data-slot="segmented-bar"
      data-size={size}
      className={cn("flex min-w-0 flex-col gap-3", className)}
      onPointerLeave={() => setActive(null)}
      {...props}
    >
      <div
        ref={bar}
        role="img"
        aria-label={`${label}: ${said}`}
        className={cn("relative", size === "tall" ? "h-7" : "h-2")}
      >
        <div className={cn("absolute inset-0", drawIn && "chart-draw")}>
          {drawn.map((part) => {
            // Each part is the whole bar, cut down to its share: the cut moves when the shares
            // change, and nothing is laid out again. Two parts meet across a 2px gap.
            const left = `calc(${percent(part.start)} + ${part.key === firstDrawn ? 0 : 1}px)`;
            const right = `calc(${percent(1 - part.end)} + ${part.key === lastDrawn ? 0 : 1}px)`;
            return (
              <div
                key={part.key}
                aria-hidden
                data-quiet={active !== null && active !== part.key ? "" : undefined}
                onPointerEnter={() => setActive(part.key)}
                className="absolute inset-0 transition-[clip-path,opacity] spring-settle data-quiet:opacity-35"
                style={{
                  backgroundColor: colorOf(part.index),
                  clipPath: `inset(0 ${right} 0 ${left} round ${radius}px)`,
                }}
              >
                {size === "tall" && (
                  <span
                    data-share
                    className="absolute top-0 flex h-full items-center overflow-hidden text-xs font-semibold whitespace-nowrap tabular-nums data-[fits=false]:invisible"
                    style={{
                      left: `calc(${percent(part.start)} + 8px)`,
                      width: `calc(${percent(part.share)} - 16px)`,
                      color: `var(--lf-on-series-${Math.min(part.index, 5) + 1})`,
                    }}
                  >
                    {numbers.share(part.share)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {legend && (
        <ul aria-hidden className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {parts.map((part) => (
            <li
              key={part.key}
              onPointerEnter={() => setActive(part.key)}
              className={cn(
                "flex items-center gap-2 text-fg-body transition-opacity spring-settle",
                active !== null && active !== part.key && "opacity-50",
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: colorOf(part.index) }}
              />
              {part.item.name}
              <span className="text-fg-muted tabular-nums">{numbers.share(part.share)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
