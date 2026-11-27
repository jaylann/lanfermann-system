import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

import { type LinkVariants, linkVariants } from "./link-variants";

export type LinkProps = ComponentProps<"a"> &
  LinkVariants & {
    /**
     * The link leaves the site (another site, a provider's dashboard, a repository): it opens in
     * a new tab without handing on where it came from, an arrow that points out stands after its
     * last word, and assistive tech hears that a new tab opens. `target` and `rel` still win.
     */
    external?: boolean;
    /** What assistive tech hears after the link's words when it is `external`. */
    externalLabel?: string;
  };

/**
 * A text link: a plain `<a>`, Indigo and underlined. Word it as where it leads ("Alle Angebote
 * ansehen"), never "hier" or "mehr". For a link that should look like a button, style an `<a>`
 * with `buttonVariants()`; for a router's link component, use `linkVariants()`.
 *
 * `external` is for a link that leaves the site. Name the place it leads to ("Repository auf
 * GitHub"); the arrow says that it leaves, the words say where to.
 */
export function Link({
  className,
  variant,
  external = false,
  externalLabel = "öffnet in einem neuen Tab",
  children,
  ...props
}: LinkProps) {
  return (
    <a
      data-slot="link"
      data-variant={variant ?? "accent"}
      data-external={external ? "" : undefined}
      {...(external ? { target: "_blank", rel: "noreferrer" } : undefined)}
      className={cn(linkVariants({ variant }), className)}
      {...props}
    >
      {children}
      {external && (
        // A word joiner holds the arrow to the last word, so it never starts a line alone; the
        // box is its own, so the underline ends with the words.
        <span data-slot="link-external" className="inline-block whitespace-nowrap no-underline">
          <span aria-hidden>&#8288;</span>
          <ExternalArrow />
          <span className="sr-only">, {externalLabel}</span>
        </span>
      )}
    </a>
  );
}

/**
 * The arrow that points out of the site, drawn like the glyphs (mitred joins, butt ends) and
 * sized by the text it follows. It is whole at rest, because here it is a fact about the link
 * and not an invitation; under the pointer or the keyboard it moves a pixel on its way out and
 * seats back (`seat`). Under reduced motion it stays where it is.
 */
function ExternalArrow() {
  return (
    <svg
      data-slot="link-external-arrow"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="miter"
      strokeLinecap="butt"
      aria-hidden
      className={[
        "ms-[0.12em] inline-block size-[0.7em] overflow-visible align-[0.04em]",
        "transition-[translate] spring-seat",
        "in-[a:hover,a:focus-visible]:translate-x-px in-[a:hover,a:focus-visible]:-translate-y-px in-[a:hover,a:focus-visible]:spring-snap",
        "motion-reduce:translate-none!",
      ].join(" ")}
    >
      <path d="M3.5 12.5 12 4" />
      <path d="M5.5 3.5H12.5V10.5" />
    </svg>
  );
}
