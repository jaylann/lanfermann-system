import type { ComponentProps, ReactNode } from "react";

import { containerVariants } from "@/components/container/container";
import { cn } from "@/lib/cn";

import { SiteFooterFloor } from "./site-footer-floor";

/**
 * The end of a website: what this is, where else one can go, who made it, and the small print.
 * It is the floor of the page: a quiet strip one step off the ground, under a hairline, so it
 * does not compete with the ask above it. Near its end the window around the page takes its
 * colour, so Safari's toolbar under it matches (`SiteFooterFloor`).
 *
 * Put a `SiteFooterBrand` and a `SiteFooterNav` (with `SiteFooterGroup`s) in a `SiteFooterMain`,
 * then a `SiteFooterLegal`.
 */
export function SiteFooter({ className, children, ...props }: ComponentProps<"footer">) {
  return (
    <footer
      data-slot="site-footer"
      className={cn("border-t border-hairline bg-surface-quiet text-fg-body", className)}
      {...props}
    >
      <div
        data-slot="site-footer-inner"
        className={cn(containerVariants(), "flex flex-col gap-12 pt-14 pb-10")}
      >
        {children}
      </div>
      <SiteFooterFloor />
    </footer>
  );
}

/** The brand beside the places on a desk, above them on a phone. */
export function SiteFooterMain({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="site-footer-main"
      className={cn("grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]", className)}
      {...props}
    />
  );
}

/**
 * What this site is about: the product's mark and name, or the drawn `Wordmark` alone, and one
 * or two lines of text beneath it.
 */
export function SiteFooterBrand({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="site-footer-brand"
      className={cn("flex max-w-[22rem] flex-col items-start gap-3 text-fg-muted", className)}
      {...props}
    />
  );
}

/** The other places, as columns of links. Give it a name with `aria-label`. */
export function SiteFooterNav({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      data-slot="site-footer-nav"
      className={cn("grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3", className)}
      {...props}
    />
  );
}

export type SiteFooterGroupProps = Omit<ComponentProps<"div">, "title"> & {
  /** What the links below have in common: a noun ("Dokumentation"). */
  title: ReactNode;
};

/** One column: a name, and the links under it. */
export function SiteFooterGroup({ title, className, children, ...props }: SiteFooterGroupProps) {
  return (
    <div data-slot="site-footer-group" className={cn("flex flex-col gap-3", className)} {...props}>
      <p className="text-sm font-semibold text-fg">{title}</p>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

/** The look of a link in the footer, for a router's link in a `<li>` of its own. */
export const siteFooterLinkClass =
  "rounded-xs text-fg-body underline decoration-transparent decoration-1 underline-offset-[0.25em] transition-colors spring-snap hover:text-fg hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * One place: a link that says where it leads. In a column of links the place says that it is a
 * link, so the underline waits for the pointer.
 */
export function SiteFooterLink({ className, ...props }: ComponentProps<"a">) {
  return (
    <li data-slot="site-footer-item">
      <a data-slot="site-footer-link" className={cn(siteFooterLinkClass, className)} {...props} />
    </li>
  );
}

/**
 * The last row: who made this on one side, the license and the year on the other, and the small
 * print beneath, at the floor of the type scale.
 */
export function SiteFooterLegal({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="site-footer-legal"
      className={cn(
        "flex flex-col gap-4 border-t border-hairline pt-6 text-sm text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}
