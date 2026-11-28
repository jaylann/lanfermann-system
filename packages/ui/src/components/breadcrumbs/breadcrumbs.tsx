import type { useRender } from "@base-ui/react/use-render";
import { type ComponentProps, useId } from "react";

import { ChevronRightGlyph } from "@/internal/glyphs";
import { renderAs } from "@/internal/render-as";
import { cn } from "@/lib/cn";
import { Localized } from "@/locale/localized";

export type BreadcrumbsProps = ComponentProps<"nav"> & {
  /**
   * The name of the trail for assistive tech. Left out, it is the word of the nearest
   * `LocaleProvider` („Pfad“ without one).
   */
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
export function Breadcrumbs({ label, className, children, ...props }: BreadcrumbsProps) {
  const wordId = useId();
  // Named by the caller (`label`, or an attribute of its own): nothing is added.
  const named =
    label !== undefined ||
    props["aria-label"] !== undefined ||
    props["aria-labelledby"] !== undefined;
  return (
    <nav
      data-slot="breadcrumbs"
      aria-label={label}
      aria-labelledby={named ? undefined : wordId}
      className={className}
      {...props}
    >
      {/* The table's word, hidden, as the trail's name: an attribute cannot follow the
          provider from a server file, a text can. */}
      {!named && (
        <span id={wordId} hidden>
          <Localized ns="breadcrumbs" name="label" />
        </span>
      )}
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

/**
 * A place that is a page. For a router's link, pass it as `render`. In a file browser it can
 * take a drop (spread `useDropTarget`'s props on it): while files or items hang over it, it
 * wears the field's halo, as a folder's tile does.
 */
export function BreadcrumbLink({ render, className, ...props }: BreadcrumbLinkProps) {
  return renderAs("a", render, {
    ...props,
    "data-slot": "breadcrumb-link",
    className: cn(
      "rounded-xs underline decoration-transparent decoration-1 underline-offset-[0.25em] hover:text-fg hover:decoration-current",
      "transition-[color,text-decoration-color,box-shadow] spring-snap data-drop-over:text-fg data-drop-over:shadow-field-focus",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      className,
    ),
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
