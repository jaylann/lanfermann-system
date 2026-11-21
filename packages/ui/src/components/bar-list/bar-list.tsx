"use client";

import type { useRender } from "@base-ui/react/use-render";
import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
} from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { chartFormat } from "@/internal/chart/format";
import { useLive } from "@/internal/presence";
import { useReducedMotion } from "@/internal/reduced-motion";
import { renderAs } from "@/internal/render-as";
import { fillStyle, troughFill, troughTrack } from "@/internal/trough";
import { cn } from "@/lib/cn";

export type BarListItem = {
  /** What the row is: a customer, a page, a source. */
  name: string;
  value: number;
  /** Stays the same while the row moves; the name when left out. */
  key?: string;
  /** A symbol before the name. */
  icon?: IconSvgElement;
  /** Or a mark of its own (a site's icon, an avatar), 16px. */
  mark?: ReactNode;
  /** Where the row leads: the whole row is the link. */
  href?: string;
  /** A router's link in place of the `<a>` (`<Link href="…" />`). */
  render?: useRender.RenderProp;
};

export type BarListProps = Omit<ComponentProps<"ul">, "children"> & {
  data: readonly BarListItem[];
  /** How values are written, as `Intl.NumberFormat` options. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** Largest first (the default). `false` keeps the order given, for rows with an order of their own. */
  sort?: boolean;
  /** At most this many rows; the share still counts all of them. */
  limit?: number;
  /** Also write each row's share of the whole, „38 %“. */
  share?: boolean;
  /**
   * `neutral` measures in the text colour, as a `Meter` does; `accent` is Indigo, for the one
   * list a view is about.
   */
  tone?: "neutral" | "accent";
  /**
   * How a bar is drawn; all three stay (Justin, 2026-11-20).
   * - `wash` (the default): a quiet wash behind the name, as tall as its row. For the lists of
   *   an analytics page (pages, sources, countries), where names are read first.
   * - `thin`: name and value on one line, a thin bar under them. For a compact list in a card,
   *   where the amounts matter more than the names.
   * - `trough`: the bar lies in a `Meter`'s trough, for parts of a whole or usage against a limit.
   */
  variant?: "wash" | "thin" | "trough";
  /**
   * Whether the bars grow out of their baseline one after the other where the list first shows
   * (the default, Justin 2026-11-20). Off under reduced motion.
   */
  drawIn?: boolean;
};

/**
 * Things ranked by an amount: customers by revenue, pages by visits, sources by sign-ups. A row
 * per thing, its name and its value, and a bar as long as its share of the largest, so the eye
 * compares along one baseline. One colour for every bar: the bars are one series and their
 * length already says how much.
 *
 * Name it with an `aria-label`; under a `CardBar` the heading says what is ranked. When the
 * ranking changes, the rows glide to their new places and the bars to their new lengths. A row
 * with `href` is a link as a whole.
 */
export function BarList({
  data,
  format,
  locale = "de-DE",
  sort = true,
  limit,
  share = false,
  tone = "neutral",
  variant: bar = "wash",
  drawIn = true,
  className,
  ...props
}: BarListProps) {
  const live = useLive();
  const still = useReducedMotion();
  const list = useRef<HTMLUListElement>(null);
  const numbers = chartFormat(locale, format);

  const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const ranked = sort ? [...data].sort((a, b) => b.value - a.value) : [...data];
  const rows = limit === undefined ? ranked : ranked.slice(0, limit);
  const largest = Math.max(0, ...rows.map((item) => item.value));
  const keyOf = (item: BarListItem) => item.key ?? item.name;

  // A row that changes place glides there: measured before and after, moved back by the
  // difference, then let go on `glide` (FLIP). Only `translate`, so nothing is laid out again.
  const places = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const box = list.current;
    if (!box) return;
    const now = new Map<string, number>();
    for (const row of box.querySelectorAll<HTMLElement>(":scope > [data-key]")) {
      const key = row.dataset.key!;
      now.set(key, row.offsetTop);
      const before = places.current.get(key);
      if (still || before === undefined || before === row.offsetTop) continue;
      row.style.transition = "none";
      row.style.translate = `0 ${before - row.offsetTop}px`;
      // Read layout so the move back is a change of its own, then let the row go.
      void row.offsetHeight;
      row.style.transition = "";
      row.style.translate = "";
    }
    places.current = now;
  });

  return (
    <ul
      ref={list}
      data-slot="bar-list"
      data-variant={bar}
      data-live={live || undefined}
      className={cn("flex min-w-0 flex-col", bar === "wash" ? "gap-1" : "gap-3", className)}
      {...props}
    >
      {rows.map((item, index) => {
        const fraction = largest > 0 ? Math.max(0, item.value) / largest : 0;
        const fill = (
          <span
            aria-hidden
            className={cn(
              troughFill,
              "block transition-[translate] spring-glide motion-reduce:transition-none",
              // Grown in once where the list first shows; a row that joins later grows too.
              drawIn && "chart-grow",
              // A wash is as tall as its row: a full round end would be a half circle. Its
              // end takes the radius its start has, so the bar is one even shape.
              bar === "wash" && "rounded-sm",
              bar === "wash"
                ? tone === "accent"
                  ? "bg-accent/16"
                  : "bg-fg/8"
                : tone === "accent"
                  ? "bg-accent"
                  : "bg-fg",
            )}
            style={
              // The queue of the first draw. It stays: a CSS animation would take a new delay
              // mid-way.
              { ...fillStyle(fraction), "--chart-grow-index": index } as CSSProperties
            }
          />
        );
        const name = (
          <span className="flex min-w-0 items-center gap-2">
            {item.icon ? (
              <Icon icon={item.icon} className="shrink-0 text-fg-muted" />
            ) : item.mark ? (
              <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
                {item.mark}
              </span>
            ) : null}
            <span className="truncate">{item.name}</span>
          </span>
        );
        const figures = (
          <>
            <span className="text-right whitespace-nowrap text-fg tabular-nums">
              {numbers.value(item.value)}
            </span>
            {share && (
              <span className="w-[4ch] text-right whitespace-nowrap text-fg-muted tabular-nums">
                {numbers.share(total > 0 ? Math.max(0, item.value) / total : 0)}
              </span>
            )}
          </>
        );

        const body =
          bar === "wash" ? (
            <>
              <span className="relative flex min-h-8 min-w-0 items-center px-2.5">
                <span aria-hidden className="absolute inset-0 overflow-hidden rounded-sm">
                  {fill}
                </span>
                <span className="relative min-w-0 text-fg-body">{name}</span>
              </span>
              {figures}
            </>
          ) : (
            <>
              <span className="min-w-0 text-fg-body">{name}</span>
              {figures}
              <span
                aria-hidden
                className={cn(
                  bar === "trough"
                    ? "relative col-span-full block h-1.5"
                    : "relative col-span-full block h-1",
                  // A thin bar is round at both ends, like the system's 2px rules (Justin,
                  // 2026-11-20).
                  bar === "trough" ? troughTrack : "overflow-hidden rounded-full",
                )}
              >
                {fill}
              </span>
            </>
          );

        const rowClass = cn(
          "grid items-center gap-x-4 text-control",
          share ? "grid-cols-[minmax(0,1fr)_auto_auto]" : "grid-cols-[minmax(0,1fr)_auto]",
          bar === "wash" ? "rounded-sm pr-2.5" : "gap-y-1.5",
        );
        // Under the pointer a washed row lights the rest of its track, flush with the bar: the
        // same edge, the same height, the same corners, so the two read as one shape. A row with
        // a thin bar takes the wash of a list row around it.
        const rowHover = bar === "wash" ? "" : "-mx-2 rounded-md px-2 py-1.5 -my-1.5";
        const key = keyOf(item);
        return (
          <li
            key={key}
            data-key={key}
            className="transition-[translate,opacity] spring-glide in-data-live:starting:opacity-0"
          >
            {item.href || item.render ? (
              renderAs("a", item.render, {
                href: item.href,
                className: cn(
                  rowClass,
                  rowHover,
                  "transition-colors spring-snap hover:bg-hover",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                ),
                children: body,
              })
            ) : (
              <div className={rowClass}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
