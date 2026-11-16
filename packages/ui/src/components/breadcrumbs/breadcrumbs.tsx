"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps } from "react";

import { ChevronRightGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

export type BreadcrumbsProps = ComponentProps<"nav"> & {
  /** The name of the trail for assistive tech. */
  label?: string;
};

/**
 * Where a page stands: the places above it, from the outside in, each a step back. It stands
 * above a page's title in place of a label ("Doku › Anleitungen"), small and muted, so the title
 * stays the first thing read.
 *
 * Put a `BreadcrumbItem` per place: a `BreadcrumbLink` for a place that is a page, plain text
 * for a group that is none. The page itself may end the trail as `BreadcrumbPage`; leave it out
 * when its title follows right below.
 */
export function Breadcrumbs({ label = "Pfad", className, children, ...props }: BreadcrumbsProps) {
  return (
    <nav data-slot="breadcrumbs" aria-label={label} className={className} {...props}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-fg-muted">
        {children}
      </ol>
    </nav>
  );
}

/** One place in the trail. A chevron before it says it lies inside the one before. */
export function BreadcrumbItem({ className, children, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn(
        "group/crumb inline-flex min-w-0 items-center gap-1.5 [&:first-child>[data-slot=breadcrumb-separator]]:hidden",
        className,
      )}
      {...props}
    >
      <ChevronRightGlyph
        data-slot="breadcrumb-separator"
        aria-hidden
        strokeWidth={1.5}
        className="text-line"
      />
      {children}
    </li>
  );
}

export type BreadcrumbLinkProps = useRender.ComponentProps<"a">;

/** A place that is a page. For a router's link, pass it as `render`. */
export function BreadcrumbLink({ render, className, ...props }: BreadcrumbLinkProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: {
      ...props,
      "data-slot": "breadcrumb-link",
      className: cn(
        "rounded-xs underline decoration-transparent decoration-1 underline-offset-[0.25em] transition-colors spring-snap hover:text-fg hover:decoration-current",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      ),
    },
  });
}

/** The page the reader is on, at the end of the trail. */
export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn("truncate text-fg", className)}
      {...props}
    />
  );
}
