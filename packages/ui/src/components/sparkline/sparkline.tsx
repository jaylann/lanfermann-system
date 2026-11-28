import type { ComponentProps, ReactNode } from "react";

import { lane, laneAt } from "@/internal/chart/lane";
import { areaPath, type Curve, linePath, type MaybePoint, SIZE } from "@/internal/chart/path";
import { extent, share } from "@/internal/chart/scale";
import { type SeriesColor, seriesPaint } from "@/internal/chart/series-color";
import { cn } from "@/lib/cn";

export type SparklineProps = Omit<ComponentProps<"span">, "children" | "color"> & {
  /** The values, oldest first. `null` is a gap. */
  data: readonly (number | null)[];
  /** `area` washes the room under the line, fading to its foot. */
  variant?: "line" | "area";
  /**
   * `neutral` is the text colour, `accent` Indigo for the one figure a view is about, `muted`
   * the quiet grey for a trend that is only context.
   */
  tone?: "neutral" | "accent" | "muted";
  /**
   * The series colour of what the line is about, where that has one of its own: the trend of a
   * service in the colour its bars and parts wear. It wins over `tone`.
   */
  color?: SeriesColor;
  curve?: Curve;
  /** Its height in px; it takes the width of its place. */
  height?: number;
  /** Whether the line starts from zero. Off by default: a sparkline shows a shape, not a size. */
  zero?: boolean;
  /** Mark the latest value with a dot. */
  end?: boolean;
  /**
   * What the line says, in words: „Umsatz der letzten 30 Tage, steigend“. Without it the
   * sparkline is decoration, hidden from assistive tech: say the trend beside it then.
   */
  label?: string;
  /** Whether it draws itself in where it first shows (the charts' default). */
  drawIn?: boolean;
};

const colors = {
  neutral: "var(--lf-text)",
  accent: "var(--lf-series-1)",
  muted: "var(--lf-text-muted)",
} as const;

/**
 * A trend in a line's room: how a figure got where it is. It stands after the value in a `Stat`
 * or in a table's cell, without axes or a readout; the figure beside it says the number.
 *
 * Plain markup and server-safe: the line is drawn in a stretched square as a chart's is, so it
 * takes any width without measuring.
 */
export function Sparkline({
  data,
  variant = "line",
  tone = "neutral",
  color: named,
  curve = "smooth",
  height = 32,
  zero = false,
  end = true,
  label,
  drawIn = true,
  className,
  style,
  ...props
}: SparklineProps) {
  const range = extent(data);
  let [low, high] = range ?? [0, 1];
  if (zero) {
    low = Math.min(0, low);
    high = Math.max(0, high);
  }
  if (low === high) {
    low -= 1;
    high += 1;
  }
  // A little room above and below, so a 2px line on its extremes is never cut.
  const pad = (high - low) * 0.08;
  const domain: [number, number] = [low - (zero && low === 0 ? 0 : pad), high + pad];
  const points: MaybePoint[] = data.map((value, index) =>
    value === null || !Number.isFinite(value)
      ? null
      : { x: data.length > 1 ? index / (data.length - 1) : 0.5, y: 1 - share(value, domain) },
  );
  const lastIndex = points.findLastIndex((point) => point !== null);
  const last = lastIndex === -1 ? null : points[lastIndex]!;
  const base = 1 - Math.min(1, Math.max(0, share(Math.max(domain[0], 0), domain)));
  const color = named === undefined ? colors[tone] : seriesPaint(named).fill;

  const box = (children: ReactNode, mask?: string) => (
    <svg
      aria-hidden
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      preserveAspectRatio="none"
      className="absolute inset-0 size-full overflow-visible"
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
    >
      {children}
    </svg>
  );

  return (
    <span
      data-slot="sparkline"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative block w-full min-w-12", className)}
      style={{ height, ...style }}
      {...props}
    >
      <span className={cn("absolute inset-0", drawIn && "chart-draw")}>
        {variant === "area" &&
          box(
            <path d={areaPath(points, base, curve)} style={{ fill: color }} />,
            // The wash fades towards the foot: a mask, so no gradient needs an id.
            "linear-gradient(to bottom, rgb(0 0 0 / 0.2), rgb(0 0 0 / 0))",
          )}
        {box(
          <path
            d={linePath(points, curve)}
            fill="none"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: color }}
          />,
        )}
      </span>
      {end && last && (
        <span aria-hidden className={lane} style={laneAt(last.x, 1 - last.y)}>
          <span
            className="absolute right-0 bottom-0 size-1.5 translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-ground in-data-[slot=card]:ring-surface"
            style={{ backgroundColor: color }}
          />
        </span>
      )}
    </span>
  );
}
