import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  // Flat: a badge is read, not pressed. A faint edge in its own colour keeps it crisp.
  "inline-flex h-[1.375rem] shrink-0 items-center gap-1 rounded-sm px-2 text-sm font-medium whitespace-nowrap inset-ring inset-ring-current/15 forced-colors:outline",
  {
    variants: {
      tone: {
        neutral: "bg-surface-quiet text-fg-body",
        info: "bg-info-soft text-info",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

/** The dot of each tone. A neutral state is a ring: open, not yet anything (a draft). */
const dots = {
  neutral: "border-[1.5px] border-fg-muted",
  info: "bg-info forced-colors:bg-[CanvasText]",
  success: "bg-success forced-colors:bg-[CanvasText]",
  warning: "bg-warning forced-colors:bg-[CanvasText]",
  danger: "bg-danger forced-colors:bg-[CanvasText]",
} as const;

export type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /**
     * The tone as a dot before the word, on a neutral badge. For a column of states in a table,
     * where a tinted badge on every row is louder than what the row is about.
     */
    dot?: boolean;
  };

/**
 * A short state on a row or a card: "Entwurf", "Bezahlt", "Überfällig". One or two words, in
 * sentence case. Colour never carries the state alone: the word does, and a 12px icon may help.
 */
export function Badge({ className, tone, dot = false, children, ...props }: BadgeProps) {
  const hue = tone ?? "neutral";
  return (
    <span
      data-slot="badge"
      data-tone={hue}
      data-dot={dot ? "" : undefined}
      className={cn(
        badgeVariants({ tone: dot ? "neutral" : tone }),
        dot && "gap-1.5 ps-1.5",
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          data-slot="badge-dot"
          className={cn("size-2 shrink-0 rounded-full", dots[hue])}
        />
      )}
      {children}
    </span>
  );
}
