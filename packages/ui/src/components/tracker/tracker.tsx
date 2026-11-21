"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Icon } from "@/components/icon/icon";
import { labelAlong, lane, laneAt } from "@/internal/chart/lane";
import { inferInterval, pointLabel, type TimeValue, toTime } from "@/internal/chart/time";
import { statusIcons, statusIconTone } from "@/internal/status-icon";
import { cn } from "@/lib/cn";

export type TrackerStatus = "success" | "warning" | "danger" | "none";

export type TrackerItem = {
  /** Stays the same while the strip moves on; the date or the place when left out. */
  key?: string;
  /** The moment the cell stands for: a day, an hour, a run. */
  date?: TimeValue;
  /** What the cell is called where it has no date („Lauf 418“), or in place of the date. */
  label?: string;
  status: TrackerStatus;
  /** One more fact for the readout and the list: „12 Minuten gestört“, „3 von 412 fehlgeschlagen“. */
  detail?: string;
};

export type TrackerProps = Omit<ComponentProps<"figure">, "children"> & {
  /** One cell per day, hour or run, oldest first. */
  data: readonly TrackerItem[];
  /** What the strip shows, in a few words: its accessible name. */
  label: string;
  /** The words for each status. A status is always said, never told by colour alone. */
  statusLabels?: Partial<Record<TrackerStatus, string>>;
  /**
   * Whether the cells come in one after another, left to right, where the strip first shows
   * (the default, as every chart draws itself in). Off under reduced motion.
   */
  drawIn?: boolean;
  locale?: string;
};

const defaultLabels: Record<TrackerStatus, string> = {
  success: "In Ordnung",
  warning: "Gestört",
  danger: "Ausgefallen",
  none: "Keine Daten",
};

/*
 * The colour of each status. A run of good days is the background of the news, not the news:
 * the green is the solid status fill at 80% (Justin, 2026-11-21; 70% read greyish, full strength
 * a heavy slab), which keeps 3:1 against the ground on Paper and on Ink and lets a disturbed or
 * failed day stand out at full strength. A day without data is a
 * faint wash of the text colour, a placeholder a little lighter than any ground; the sunken
 * trough read as holes on Ink (Justin, 2026-11-21).
 */
const fills: Record<TrackerStatus, string> = {
  success: "bg-success-solid/80",
  warning: "bg-warning-solid",
  danger: "bg-danger-solid",
  none: "bg-fg/10",
};

const iconTone = {
  success: "success",
  warning: "warning",
  danger: "danger",
  none: "neutral",
} as const;

type Scrub = { index: number; shown: boolean; entry: number; touch: boolean };

/**
 * A strip of cells, one per day, hour or run, each with its status: the uptime of a service
 * over ninety days, the last fifty runs of a job. A good stretch recedes and a bad day stands
 * out. Say the summary above it in words („99,8 % verfügbar“); the strip shows when it went
 * wrong.
 *
 * Every cell says its status in words and with the status symbol, in the readout under the
 * pointer and in a list for assistive tech. Keyboard: the strip is one stop, the arrows walk the
 * cells, Home and End jump, Escape leaves, and each cell is said aloud.
 */
export function Tracker({
  data,
  label,
  statusLabels,
  drawIn = true,
  locale = "de-DE",
  className,
  ...props
}: TrackerProps) {
  const words = { ...defaultLabels, ...statusLabels };
  const [scrub, setScrub] = useState<Scrub | null>(null);
  const [said, setSaid] = useState("");
  const finger = useRef<number | null>(null);

  const times = useMemo(
    () => data.map((item) => (item.date === undefined ? Number.NaN : toTime(item.date))),
    [data],
  );
  const dated = times.filter(Number.isFinite);
  const interval = dated.length === data.length ? inferInterval(times) : null;
  const withYear =
    dated.length > 0 && new Date(dated[0]!).getFullYear() !== new Date(dated.at(-1)!).getFullYear();
  const nameOf = (index: number) => {
    const item = data[index]!;
    if (item.label) return item.label;
    return interval && Number.isFinite(times[index]!)
      ? pointLabel(times[index]!, interval, { locale, withYear })
      : String(index + 1);
  };
  const sentence = (index: number) => {
    const item = data[index]!;
    return `${nameOf(index)}: ${words[item.status]}${item.detail ? `, ${item.detail}` : ""}`;
  };

  const count = data.length;
  const dense = count > 60;
  const active = scrub && data[scrub.index] ? scrub : null;

  const show = (index: number, how: { touch?: boolean; keyboard?: boolean } = {}) => {
    setScrub((old) => ({
      index,
      shown: true,
      entry: old?.shown ? old.entry : (old?.entry ?? 0) + 1,
      touch: how.touch ?? false,
    }));
    if (how.keyboard) setSaid(sentence(index));
  };
  const hide = () => setScrub((old) => (old?.shown ? { ...old, shown: false, touch: false } : old));

  const indexAt = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const share = box.width > 0 ? (event.clientX - box.left) / box.width : 0;
    return Math.min(count - 1, Math.max(0, Math.floor(share * count)));
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" || count === 0 || finger.current !== null) return;
    finger.current = event.pointerId;
    show(indexAt(event), { touch: true });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (count === 0) return;
    if (event.pointerType !== "mouse" && event.pointerId !== finger.current) return;
    const index = indexAt(event);
    if (scrub?.shown && scrub.index === index) return;
    show(index, { touch: event.pointerType !== "mouse" });
  };
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") {
      if (event.type === "pointerleave") hide();
      return;
    }
    if (event.pointerId !== finger.current) return;
    finger.current = null;
    hide();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (count === 0) return;
    const last = count - 1;
    const from = scrub?.shown ? scrub.index : null;
    const to =
      event.key === "ArrowRight"
        ? from === null
          ? last
          : Math.min(last, from + 1)
        : event.key === "ArrowLeft"
          ? from === null
            ? last
            : Math.max(0, from - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : undefined;
    if (event.key === "Escape" && scrub?.shown) {
      event.preventDefault();
      hide();
      return;
    }
    if (to === undefined) return;
    event.preventDefault();
    show(to, { keyboard: true });
  };

  const at = active ? (active.index + 0.5) / count : 0;
  const first = dated.length > 0 && interval ? edgeLabel(dated[0]!, interval, locale) : null;
  const last = dated.length > 0 && interval ? edgeLabel(dated.at(-1)!, interval, locale) : null;

  return (
    <figure
      data-slot="tracker"
      aria-label={label}
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    >
      <div
        data-slot="tracker-strip"
        data-active={active?.shown || undefined}
        data-scrubbing={active?.shown && active.touch ? "touch" : undefined}
        role="group"
        aria-roledescription="Verlauf"
        aria-label={`${label}. Mit den Pfeiltasten durch die Einträge gehen.`}
        tabIndex={count > 0 ? 0 : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={onPointerEnd}
        onKeyDown={onKeyDown}
        onBlur={hide}
        className={cn(
          "group/tracker relative flex h-8 touch-pan-y select-none",
          dense ? "gap-px" : "gap-0.5",
          "rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
        )}
      >
        {data.map((item, index) => (
          <span
            key={item.key ?? (Number.isFinite(times[index]!) ? times[index] : index)}
            aria-hidden
            data-status={item.status}
            data-current={active?.shown && active.index === index ? "" : undefined}
            className={cn(
              "h-full min-w-0 flex-1 transition-opacity spring-snap",
              dense ? "rounded-[1.5px]" : count <= 30 ? "rounded-[3px]" : "rounded-[2px]",
              fills[item.status],
              // While one cell is read, the others step back.
              "group-data-[active]/tracker:not-data-[current]:opacity-45",
              drawIn && "chart-cell-in",
            )}
            style={
              drawIn
                ? ({ "--chart-cell-at": count > 1 ? index / (count - 1) : 0 } as CSSProperties)
                : undefined
            }
          />
        ))}

        {active && (
          <div
            key={active.entry}
            aria-hidden
            data-shown={active.shown || undefined}
            className={cn(
              lane,
              "opacity-0 transition-opacity spring-leave data-shown:opacity-100 data-shown:spring-snap data-shown:starting:opacity-0",
            )}
          >
            <div className={cn(lane, "chart-follow")} style={laneAt(at)}>
              <div
                className="absolute right-0 bottom-[calc(100%+0.5rem)] chart-follow"
                style={labelAlong(at)}
              >
                <StatusReadout
                  title={nameOf(active.index)}
                  index={active.index}
                  status={data[active.index]!.status}
                  word={words[data[active.index]!.status]}
                  detail={data[active.index]!.detail}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {first && last && (
        <div
          aria-hidden
          className="flex justify-between gap-4 text-xs leading-none text-fg-muted tabular-nums"
        >
          <span>{first}</span>
          <span>{last}</span>
        </div>
      )}

      {/* Hidden by a box around it, as a table's caption would leak in Safari. */}
      <div className="sr-only">
        <ul aria-label={label}>
          {data.map((item, index) => (
            <li key={item.key ?? index}>{sentence(index)}</li>
          ))}
        </ul>
      </div>
      <p aria-live="polite" className="sr-only">
        {said}
      </p>
    </figure>
  );
}

/** The ends of the strip: „22. Aug.“ and „20. Nov.“, or hours for a strip of hours. */
function edgeLabel(time: number, interval: string, locale: string) {
  const options: Intl.DateTimeFormatOptions =
    interval === "hour"
      ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
      : interval === "month" || interval === "year"
        ? { month: "short", year: "numeric" }
        : { day: "numeric", month: "short" };
  return new Intl.DateTimeFormat(locale, options).format(time);
}

type View = {
  status: TrackerStatus;
  word: string;
  detail?: string;
  index: number;
  /** Counts the swaps, so each arriving and leaving block is an element of its own. */
  swap: number;
  /** The way the reader went: 1 to later cells, −1 to earlier ones. */
  way: 1 | -1;
};

/** A status in words with its symbol, and the further fact under it. */
function StatusBlock({ view }: { view: View }) {
  const tone = iconTone[view.status];
  return (
    <>
      <p className="flex items-center gap-1.5 font-medium whitespace-nowrap">
        <Icon icon={statusIcons[tone]} size={14} className={statusIconTone[tone]} />
        {view.word}
      </p>
      {view.detail && <p className="mt-0.5 whitespace-nowrap text-fg-muted">{view.detail}</p>}
    </>
  );
}

/**
 * The readout of a cell: when it is, and its status in words with the status symbol and a
 * further fact. On Ink, as the readout of a line chart and every tooltip.
 *
 * When the status changes on the way along the strip, it is swapped as the content of a
 * `NavigationMenu`'s sheet is (Justin, 2026-11-21): the new status arrives from the side the
 * reader is going to, the old one leaves to the other, and the sheet eases to its new size. The
 * date changes in place: it changes with every cell.
 */
function StatusReadout({
  title,
  index,
  status,
  word,
  detail,
}: {
  title: string;
  index: number;
  status: TrackerStatus;
  word: string;
  detail?: string;
}) {
  const [view, setView] = useState<View>({ status, word, detail, index, swap: 0, way: 1 });
  const [leaving, setLeaving] = useState<View | null>(null);
  // Compared while rendering, as React asks for state that follows a prop.
  if (status !== view.status) {
    const way = index >= view.index ? 1 : -1;
    setLeaving({ ...view, way });
    setView({ status, word, detail, index, swap: view.swap + 1, way });
  } else if (index !== view.index || word !== view.word || detail !== view.detail) {
    setView({ ...view, word, detail, index });
  }

  // A block that leaves is dropped when its motion ends, or after it where none runs.
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(null), 400);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // The sheet takes the size of what it holds, and eases to a new one once it has stood.
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
    <div
      ref={sheet}
      data-slot="chart-readout"
      data-theme="ink"
      className="overflow-hidden rounded-md bg-sheet text-sm text-fg depth-floating data-sized:transition-[width,height] data-sized:spring-settle"
    >
      <div ref={inner} className="w-max min-w-36 px-2.5 pt-1.5 pb-2">
        <p className="mb-1 text-xs whitespace-nowrap text-fg-muted">{title}</p>
        <div className="relative">
          {leaving && (
            <div
              key={`leaving-${leaving.swap}`}
              aria-hidden
              className="absolute inset-x-0 top-0 translate-x-[calc(var(--way)*-0.75rem)] opacity-0 transition-[translate,opacity] spring-leave motion-reduce:translate-x-0 starting:translate-x-0 starting:opacity-100"
              style={{ "--way": leaving.way } as CSSProperties}
            >
              <StatusBlock view={leaving} />
            </div>
          )}
          <div
            key={`view-${view.swap}`}
            className={cn(
              "transition-[translate,opacity] spring-settle",
              // The first status stands; only a change arrives, a moment after the old one has
              // begun to leave, so the two are never read on top of each other.
              view.swap > 0 &&
                "delay-[70ms] starting:translate-x-[calc(var(--way)*0.75rem)] starting:opacity-0 motion-reduce:starting:translate-x-0",
            )}
            style={{ "--way": view.way } as CSSProperties}
          >
            <StatusBlock view={view} />
          </div>
        </div>
      </div>
    </div>
  );
}
