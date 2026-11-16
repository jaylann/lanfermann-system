import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type DivProps = ComponentProps<"div">;

/**
 * A container for one object you act on: a form you submit, a plan you choose, an account. It is
 * a softly raised sheet. Do not use it to chop a page into boxes: content that is only read
 * stands on the ground under a rule (`Separator`).
 */
export function Card({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="card"
      className={cn("flex flex-col rounded-xl bg-surface depth-card", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1 px-6 pt-6", className)}
      {...props}
    />
  );
}

/** A sentence, like every title in the kit. */
export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg leading-snug font-semibold text-balance text-fg", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-fg-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: DivProps) {
  return <div data-slot="card-content" className={cn("px-6 py-5", className)} {...props} />;
}

/** The quiet strip at the bottom: secondary routes, legal lines, the state of a plan. */
export function CardFooter({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-3 rounded-b-xl border-t border-hairline bg-well px-6 py-3 text-sm text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}
