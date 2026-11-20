import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type DivProps = ComponentProps<"div">;

/**
 * A softly raised sheet. It holds one object you act on (a form you submit, a plan you choose,
 * an account), or, on an app's page, one block of it: the latest quotes, what happened lately,
 * the members of a team, each named by a `CardBar`, with its `Table` or list running to the
 * card's edges (Justin, 2026-11-19). The pages of a site and the docs are not chopped into
 * boxes: what is only read there stands on the ground under a rule (`Separator`).
 *
 * `variant="bevel"` (Fase) cuts the card like a fitting: a crisp edge, light along its top, a
 * lip along its foot and a short shadow, so it stands on the page as a machined part instead of
 * floating over it. For a card that is handled (a choice, a prompt to copy, a tile to open).
 * `variant="gloss"` (Glanz) is the same cut with a face that visibly shines and darkens toward
 * its foot, as Clerk's cards on a dark page. Both stay (Justin, 2026-11-20).
 */
export function Card({
  variant = "default",
  className,
  ...props
}: DivProps & { variant?: "default" | "bevel" | "gloss" }) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn("flex flex-col rounded-xl bg-surface", depthOf[variant], className)}
      {...props}
    />
  );
}

const depthOf = { default: "depth-card", bevel: "depth-bevel", gloss: "depth-gloss" } as const;

export function CardHeader({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1 px-6 pt-6", className)}
      {...props}
    />
  );
}

/**
 * The bar across the top of a card that holds a list, a table or a feed: its name (a `Heading`
 * of `size="label"`) and, at the end, a way to all of it („Alle Angebote“) or one action. A
 * hairline under it; what follows runs to the card's edges, its text 20px in as the bar's is.
 */
export function CardBar({ className, ...props }: DivProps) {
  return (
    <div
      data-slot="card-bar"
      className={cn(
        "flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-hairline px-5 py-2",
        className,
      )}
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
