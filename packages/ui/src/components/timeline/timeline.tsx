import type { ComponentProps, ReactNode } from "react";

import type { IconSvgElement } from "@/components/icon/icon";
import { LiveList } from "@/internal/live-list";
import { RailMark } from "@/internal/rail-mark";
import { cn } from "@/lib/cn";

/**
 * What happened lately: quotes sent and accepted, people invited, a payment that failed. A flat
 * list on a hairline rail, newest first, each entry a sentence and its time, with the system's
 * mark or a small avatar in front, drawn the way a `Trace` is (`rail.css`). Entries group under
 * their day with a `TimelineGroup`.
 *
 * An entry that joins a list already on screen opens its room and fades in; what is there when
 * the list first shows does not move (`timeline.css`). Server-safe: the list is markup, and the
 * one frame of script that tells load from later comes with it (`LiveList`).
 */
export function Timeline({ className, ...props }: ComponentProps<"ol">) {
  return (
    <LiveList
      data-slot="timeline"
      // The lead is an avatar's width for every entry, so the rail runs straight down a list
      // that mixes marks and avatars.
      className={cn(
        "flex flex-col [--rail-clear:0.25rem] [--rail-lead:1.5rem] [--rail-line:1.75rem]",
        className,
      )}
      {...props}
    />
  );
}

export type TimelineGroupProps = Omit<ComponentProps<"li">, "children"> & {
  /** The day, as people say it: „Heute“, „Gestern“, „Montag, 17. November“. */
  label: ReactNode;
  /** The day as a machine reads it (`2026-11-17`), for the `<time>` around the label. */
  dateTime?: string;
  /** Its `TimelineItem`s, newest first. */
  children: ReactNode;
};

/** The entries of one day, under the day's name. */
export function TimelineGroup({
  label,
  dateTime,
  className,
  children,
  ...props
}: TimelineGroupProps) {
  return (
    <li data-slot="timeline-group" className={cn("not-first:mt-4", className)} {...props}>
      <div data-slot="timeline-day" className="flex flex-col gap-1.5">
        <p data-slot="timeline-group-label" className="text-sm font-medium text-fg-muted">
          {dateTime ? <time dateTime={dateTime}>{label}</time> : label}
        </p>
        <ol className="flex flex-col">{children}</ol>
      </div>
    </li>
  );
}

export type TimelineItemProps = Omit<ComponentProps<"li">, "children"> & {
  /**
   * What happened, as a sentence with the names in `<strong>`: „<strong>Anna Weber</strong> hat
   * das Angebot A-2026-0418 angenommen.“
   */
  children: ReactNode;
  /** When, as people read it: „14:32“ within a day, a date after a week. */
  time?: ReactNode;
  /** The moment as a machine reads it (`2026-11-19T14:32`), for the `<time>`. */
  dateTime?: string;
  /** The person who did it: an `Avatar size="sm"`. Without one, the system's mark stands there. */
  avatar?: ReactNode;
  /** A symbol for the kind of event, in place of the disc: a mail, an invoice. */
  icon?: IconSvgElement;
  /** A failure carries the danger symbol in place of the disc. Say it in the sentence as well. */
  tone?: "neutral" | "danger";
};

/** One event: what happened, and when. */
export function TimelineItem({
  avatar,
  icon,
  tone = "neutral",
  time,
  dateTime,
  className,
  children,
  ...props
}: TimelineItemProps) {
  const lead = avatar ? "avatar" : "mark";
  return (
    <li
      data-slot="timeline-item"
      data-lead={lead}
      data-tone={tone}
      className={cn("rail-item", lead === "avatar" && "[--rail-mark:1.5rem]", className)}
      {...props}
    >
      <div
        data-slot="timeline-entry"
        className="grid grid-cols-[var(--rail-lead)_minmax(0,1fr)_auto] gap-x-3 pb-3"
      >
        <span
          data-slot="timeline-lead"
          className="flex h-(--rail-line) items-center justify-center"
        >
          {avatar ?? (
            <RailMark
              slot="timeline-mark"
              status={tone === "danger" ? "error" : "done"}
              icon={icon}
            />
          )}
        </span>
        {/* The first line stands in the middle of the lead's height. */}
        <p
          data-slot="timeline-text"
          className="py-[calc((var(--rail-line)-1lh)/2)] text-control text-pretty text-fg-body [&_strong]:font-medium [&_strong]:text-fg"
        >
          {children}
        </p>
        {time !== undefined && (
          <time
            data-slot="timeline-time"
            dateTime={dateTime}
            className="py-[calc((var(--rail-line)-1lh)/2)] text-sm whitespace-nowrap text-fg-muted tabular-nums"
          >
            {time}
          </time>
        )}
      </div>
    </li>
  );
}
