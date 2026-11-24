import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type DescriptionGridProps = ComponentProps<"dl">;

/**
 * The few facts of one thing in a narrow place (a pane, a drawer): each value under its label,
 * two to a row, no lines between them. A real `<dl>`, one `DescriptionGridItem` per fact. Where
 * the facts are many, or are compared down a column, use a `DescriptionList`.
 *
 * Server-safe.
 */
export function DescriptionGrid({ className, ...props }: DescriptionGridProps) {
  return (
    <dl
      data-slot="description-grid"
      className={cn("grid grid-cols-2 gap-x-6 gap-y-4 text-control", className)}
      {...props}
    />
  );
}

export type DescriptionGridItemProps = Omit<ComponentProps<"div">, "children"> & {
  /** What the value is: „Größe“, „Geändert“. A word or two, no colon. */
  term: ReactNode;
  /** The value. A long one wraps; give it the whole row with `className="col-span-2"`. */
  children: ReactNode;
};

/** One fact of a `DescriptionGrid`: its label, muted and small, over its value. */
export function DescriptionGridItem({
  term,
  className,
  children,
  ...props
}: DescriptionGridItemProps) {
  return (
    <div
      data-slot="description-grid-item"
      className={cn("flex min-w-0 flex-col gap-0.5", className)}
      {...props}
    >
      <dt data-slot="description-grid-term" className="text-sm text-fg-muted">
        {term}
      </dt>
      <dd data-slot="description-grid-details" className="min-w-0 break-words text-fg">
        {children}
      </dd>
    </div>
  );
}
