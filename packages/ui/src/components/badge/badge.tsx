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

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

/**
 * A short state on a row or a card: "Entwurf", "Bezahlt", "Überfällig". One or two words, in
 * sentence case. Colour never carries the state alone: the word does, and a 12px icon may help.
 */
export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-tone={tone ?? "neutral"}
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  );
}
