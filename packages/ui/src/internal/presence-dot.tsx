import type { CSSProperties } from "react";

import type { Presence } from "@/components/avatar-group/people";
import { cn } from "@/lib/cn";

const look: Record<Presence, string> = {
  // There: the full disc, in the colour of success.
  online: "bg-success-solid forced-colors:bg-[CanvasText]",
  away: "bg-warning-solid forced-colors:bg-[CanvasText]",
  // Not there: only the ring, the system's mark for what is possible but not now.
  offline:
    "inset-ring-[1.5px] inset-ring-fg-muted forced-colors:outline forced-colors:outline-1 forced-colors:-outline-offset-1 forced-colors:outline-[CanvasText]",
};

/**
 * The dot on the edge of an avatar, at the bottom end, that says whether the person is there. It stands
 * beside the avatar, not in it (the avatar is masked, and a dot inside would be cut out with
 * it), and the avatar has a hole cut for it the gap larger (`avatar-cut.ts`). Its words are
 * said elsewhere: the dot alone never carries the status. Server-safe.
 */
export function PresenceDot({
  presence,
  diameter,
  slot,
  className,
}: {
  presence: Presence;
  /** In pixels at a 16px root; it scales with the avatar. */
  diameter: number;
  slot: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      data-slot={slot}
      data-presence={presence}
      style={{ "--dot": `${diameter / 16}rem` } as CSSProperties}
      className={cn(
        "pointer-events-none absolute end-0 bottom-0 size-(--dot) rounded-full transition-[background-color,box-shadow] spring-settle",
        look[presence],
        className,
      )}
    />
  );
}
