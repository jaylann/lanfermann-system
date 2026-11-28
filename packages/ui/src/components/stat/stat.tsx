import type { useRender } from "@base-ui/react/use-render";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import type { ComponentProps, ReactNode } from "react";

import { Icon } from "@/components/icon/icon";
import { renderAs } from "@/internal/render-as";
import { ruleTop } from "@/internal/rule";
import { cn } from "@/lib/cn";

export type StatGroupProps = ComponentProps<"div"> & {
  /**
   * `ruled` (the default) stands the figures in one row with hairlines between them. On an app's
   * page put the row in a `Card`: the figures share the one card (Justin, 2026-11-19). On the
   * ground a 2px rule opens it. `cards` puts each figure on a card of its own.
   */
  variant?: "ruled" | "cards";
};

/**
 * A row of figures: what a dashboard shows first. They take the width there is and wrap; on a
 * phone they stand two by two. Put `Stat`s inside.
 */
export function StatGroup({ variant = "ruled", className, children, ...props }: StatGroupProps) {
  return (
    <div
      data-slot="stat-group"
      data-variant={variant}
      className={cn(
        "group/stats",
        variant === "ruled" && ruleTop,
        // In a card the card's edge opens the row, as it does a table's.
        variant === "ruled" && "in-data-[slot=card]:border-t-0 in-data-[slot=card]:before:hidden",
        className,
      )}
      {...props}
    >
      {/* The grid clips: the hairline before the first figure of each line, and above the
          figures of the first line, falls outside it. So the dividers stand only between. */}
      <div
        className={cn(
          "grid grid-cols-[repeat(auto-fit,minmax(min(100%,10.5rem),1fr))] max-sm:grid-cols-2",
          variant === "ruled" ? "overflow-clip" : "gap-3",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * One figure: what it is (`StatLabel`), the figure (`StatValue`), and how it changed
 * (`StatChange`). A `Meter` placed after the value shows usage against a limit, a `Sparkline`
 * the way the figure came.
 *
 * A figure is read, not operated: flat, casting no shadow. Several stand in a `StatGroup`.
 * Server-safe; the value may be a `RollingNumber`, which rolls when the figure changes on screen.
 */
export function Stat({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="stat"
      className={cn(
        "flex min-w-0 flex-col gap-1 [&>[data-slot=meter]]:mt-2 [&>[data-slot=sparkline]]:mt-2",
        // In a ruled row: a hairline before and above, of which the grid shows only the inner.
        "group-data-[variant=ruled]/stats:-mt-px group-data-[variant=ruled]/stats:-ml-px group-data-[variant=ruled]/stats:border-t group-data-[variant=ruled]/stats:border-l group-data-[variant=ruled]/stats:border-hairline group-data-[variant=ruled]/stats:px-5 group-data-[variant=ruled]/stats:py-4 max-sm:group-data-[variant=ruled]/stats:px-4",
        "group-data-[variant=cards]/stats:rounded-xl group-data-[variant=cards]/stats:bg-surface group-data-[variant=cards]/stats:px-5 group-data-[variant=cards]/stats:py-4 group-data-[variant=cards]/stats:depth-card",
        className,
      )}
      {...props}
    />
  );
}

/** What the figure is, in a few words: „Umsatz im November“. */
export function StatLabel({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="stat-label"
      className={cn("truncate text-sm text-fg-muted", className)}
      {...props}
    />
  );
}

/**
 * The figure, large and in tabular digits. Plain text, or a `RollingNumber`. It never breaks: a
 * figure split over two lines reads as two.
 */
export function StatValue({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="stat-value"
      className={cn("text-xl font-medium whitespace-nowrap text-fg tabular-nums", className)}
      {...props}
    />
  );
}

/** Which way the figure moved. */
export type StatTrend = "up" | "down" | "flat";

const turn: Record<StatTrend, string> = { up: "rotate-0", flat: "rotate-45", down: "rotate-90" };

const toneClass = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-fg-muted",
} as const;

const defaultTrendLabels: Record<StatTrend, string> = {
  up: "Gestiegen",
  down: "Gesunken",
  flat: "Unverändert",
};

export type StatChangeProps = useRender.ComponentProps<"p"> & {
  trend: StatTrend;
  /**
   * Whether the change is good news, which only the caller knows: more revenue is, more
   * cancellations are not. `neutral` (the default) says neither.
   */
  tone?: keyof typeof toneClass;
  /** After the amount, quieter: „gegenüber dem Vormonat“. */
  context?: ReactNode;
  /** What assistive tech hears before the amount, where the arrow says it to the eye. */
  trendLabels?: Partial<Record<StatTrend, string>>;
};

/**
 * How the figure changed: an arrow, the amount in the colour of its tone, and what it is
 * compared with („+12 %“ „gegenüber dem Vormonat“). The arrow and the colour never carry it
 * alone: assistive tech hears „Gestiegen“ or „Gesunken“ first, and the amount has its sign.
 *
 * When the trend turns, the arrow turns with it. Where the figure changes while it is on screen,
 * give the amount as a `RollingNumber` (`{ style: "percent", signDisplay: "exceptZero" }`), as
 * the `StatValue` takes one: it rolls to the new amount and its sign turns over.
 *
 * It is a paragraph. Inside a control, where a paragraph may not stand (the tab of a
 * `StatTab`, a button, a link), hand it the element to be: `render={<span />}`.
 */
export function StatChange({
  trend,
  tone = "neutral",
  context,
  trendLabels,
  render,
  className,
  children,
  ...props
}: StatChangeProps) {
  const labels = { ...defaultTrendLabels, ...trendLabels };
  const parts = (
    <>
      <Icon
        icon={ArrowUpRight01Icon}
        size={14}
        stroke={1.75}
        className={cn(
          // It turns on `seat`; its colour eases on `settle` (a colour cannot bounce).
          "shrink-0 [transition:rotate_var(--transition-duration-spring-seat)_var(--ease-spring-seat),color_var(--transition-duration-spring-settle)_var(--ease-spring-settle)] motion-reduce:[transition:color_var(--transition-duration-spring-settle)_var(--ease-spring-settle)]",
          turn[trend],
          toneClass[tone],
        )}
      />
      <span
        className={cn(
          "shrink-0 font-medium tabular-nums transition-colors spring-settle",
          toneClass[tone],
        )}
      >
        <span className="sr-only">{labels[trend]}: </span>
        {children}
      </span>
      {context !== undefined && <span className="text-fg-muted">{context}</span>}
    </>
  );
  return renderAs("p", render, {
    ...props,
    "data-slot": "stat-change",
    "data-trend": trend,
    "data-tone": tone,
    // What it is compared with goes under the amount where the column is narrow, not cut off.
    className: cn("flex min-w-0 flex-wrap items-center gap-x-1 text-sm", className),
    children: parts,
  });
}
