import { Alert02Icon } from "@hugeicons/core-free-icons";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { Spinner } from "@/components/spinner/spinner";
import { cn } from "@/lib/cn";

/** Where an entry on a rail stands: not begun, being worked on, finished, or failed. */
export type RailStatus = "pending" | "running" | "done" | "error";

export type RailMarkProps = {
  /** The list's own name for the part: `trace-mark`, `timeline-mark`. */
  slot: string;
  status: RailStatus;
  /** A symbol for the kind of entry, shown in place of the disc once it is done. */
  icon?: IconSvgElement;
  /**
   * How a part of the mark comes in, decided by the list: `icon` for a symbol, `disc` for the
   * disc (`Trace` closes the ring into the disc for a step that has just finished).
   */
  enter?: { icon?: string; disc?: string };
  className?: string;
};

/**
 * The mark in front of an entry on a rail (`rail.css`): an open ring waits, the spinner's arc
 * works (it is the ring before it has closed), the disc is done, and a failure carries the danger
 * symbol. Shared by `Trace` and `Timeline`, so both lists are drawn by the same hand.
 *
 * A 16px box, hidden from assistive tech: the entry says its state in words. Server-safe.
 */
export function RailMark({ slot, status, icon, enter, className }: RailMarkProps) {
  return (
    <span
      aria-hidden
      data-slot={slot}
      className={cn("flex size-4 shrink-0 items-center justify-center", className)}
    >
      {status === "running" ? (
        <Spinner size={14} className="text-fg" />
      ) : status === "error" ? (
        <Icon icon={Alert02Icon} size={14} className="text-danger" />
      ) : icon && status === "done" ? (
        <Icon
          icon={icon}
          size={14}
          className={cn("text-fg-muted transition-opacity spring-settle", enter?.icon)}
        />
      ) : (
        <span className={cn("mark", status === "done" && cn("mark-on", enter?.disc))} />
      )}
    </span>
  );
}
