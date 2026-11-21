"use client";

import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

export type ReadoutRow = {
  key: string;
  /** The series colour, as a CSS value; it resolves inside the readout, so on Ink. */
  color: string;
  /** A short line for a line, a swatch for what is filled, an empty square for nothing. */
  mark: "line" | "swatch" | "empty";
  value: string;
  label: string;
};

type Content = { title: string; rows: readonly ReadoutRow[] };

/** The words of a readout: when or what (muted, above), then a row per series. */
function Body({ title, rows }: Content) {
  return (
    <div className="px-2.5 pt-1.5 pb-2">
      <p className="mb-1 text-xs whitespace-nowrap text-fg-muted">{title}</p>
      <ul className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-0.5">
        {rows.map((row) => (
          <li key={row.key} className="col-span-3 grid grid-cols-subgrid items-center">
            <span
              aria-hidden
              className={
                row.mark === "line"
                  ? "h-0.5 w-3 rounded-full"
                  : row.mark === "empty"
                    ? "size-2.5 rounded-[3px] inset-ring inset-ring-line"
                    : "size-2.5 rounded-[3px]"
              }
              style={row.mark === "empty" ? undefined : { backgroundColor: row.color }}
            />
            <span className="text-right font-medium whitespace-nowrap tabular-nums">
              {row.value}
            </span>
            <span className="whitespace-nowrap text-fg-muted">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * What a chart says about what is under the pointer: when or what it is (muted, above), and
 * every series' value there. The value leads and the name follows, the reverse of a legend:
 * here the reader knows the series and wants the number. A short line or a swatch in the
 * series colour keys each row; the words stay in the text colours.
 *
 * It speaks on Ink on every ground, as tooltips do, and its sheet eases to the size of what it
 * holds. Where a chart reads separate things one after another (the columns of a bar chart, the
 * steps of a waterfall), it names each by `swap`: when that changes, the content is swapped as
 * a `NavigationMenu`'s sheet swaps its own (Justin, 2026-11-21): the new one arrives from the
 * side the reader goes to (`way`), a moment after the old one has begun to leave the other
 * way. Without `swap` the words change in place, for a line read point by point.
 *
 * The chart places it; `className` is for that place.
 */
export function Readout({
  title,
  rows,
  swap,
  way = 1,
  className,
}: Content & {
  /** What is being read; a new value swaps the content. */
  swap?: string | number;
  /** The way the reader went to it: 1 to the right or later, −1 to the left or earlier. */
  way?: 1 | -1;
  className?: string;
}) {
  // What stood when the last swap happened: it is what leaves at the next one.
  const [shown, setShown] = useState({ swap, title, rows, step: 0, way });
  const [leaving, setLeaving] = useState<(Content & { step: number; way: 1 | -1 }) | null>(null);
  // Compared while rendering, as React asks for state that follows a prop.
  if (swap !== undefined && swap !== shown.swap) {
    setLeaving({ title: shown.title, rows: shown.rows, step: shown.step, way });
    setShown({ swap, title, rows, step: shown.step + 1, way });
  }

  // A block that leaves is dropped once its motion is over.
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(null), 400);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // The sheet takes the size of what it holds, and eases to a new size once it has stood.
  const sheet = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const outer = sheet.current;
    const content = inner.current;
    if (!outer || !content) return;
    const fit = () => {
      outer.style.width = `${content.offsetWidth}px`;
      outer.style.height = `${content.offsetHeight}px`;
    };
    fit();
    const frame = requestAnimationFrame(() => (outer.dataset.sized = ""));
    const watch = new ResizeObserver(fit);
    watch.observe(content);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
    };
  }, []);

  return (
    <div className={className}>
      <div
        ref={sheet}
        data-slot="chart-readout"
        data-theme="ink"
        className="overflow-hidden rounded-md bg-sheet text-sm text-fg depth-floating data-sized:transition-[width,height] data-sized:spring-settle"
      >
        <div ref={inner} className="relative w-max min-w-36">
          {leaving && (
            <div
              key={`leaving-${leaving.step}`}
              aria-hidden
              className="absolute inset-x-0 top-0 translate-x-[calc(var(--way)*-0.75rem)] opacity-0 transition-[translate,opacity] spring-leave motion-reduce:translate-x-0 starting:translate-x-0 starting:opacity-100"
              style={{ "--way": leaving.way } as CSSProperties}
            >
              <Body title={leaving.title} rows={leaving.rows} />
            </div>
          )}
          <div
            key={`shown-${shown.step}`}
            className={cn(
              "transition-[translate,opacity] spring-settle",
              // The first content stands; only a swap arrives, after the old one has begun to go.
              shown.step > 0 &&
                "delay-[70ms] starting:translate-x-[calc(var(--way)*0.75rem)] starting:opacity-0 motion-reduce:starting:translate-x-0",
            )}
            style={{ "--way": shown.way } as CSSProperties}
          >
            <Body title={title} rows={rows} />
          </div>
        </div>
      </div>
    </div>
  );
}
