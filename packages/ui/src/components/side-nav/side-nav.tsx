"use client";

import { useRender } from "@base-ui/react/use-render";
import { type ComponentProps, type ReactNode, useId } from "react";

import { cn } from "@/lib/cn";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export type SideNavProps = ComponentProps<"nav"> & {
  /** The name of the navigation for assistive tech ("Dokumentation"). */
  "aria-label": string;
};

/**
 * The pages of a set that is read in parts, standing beside the page: the chapters of the docs,
 * the parts of a handbook. Groups under their names; the page the reader is on stands on the
 * tint, the "you are here" colour a `NavigationMenu` entry wears too.
 *
 * Put a `SideNavGroup` per part, with a `SideNavLink` per page. A long page may show its
 * sections under its link (`sub`). On a phone, where there is no room beside the page, the same
 * groups go into the site's menu.
 */
export function SideNav({ className, children, ...props }: SideNavProps) {
  return (
    <nav data-slot="side-nav" className={className} {...props}>
      <ul className="flex flex-col gap-7">{children}</ul>
    </nav>
  );
}

export type SideNavGroupProps = Omit<ComponentProps<"li">, "title"> & {
  /** What the pages below have in common: a noun ("Anleitungen"). */
  title: ReactNode;
};

/** One part of the set: its name, and the pages under it. */
export function SideNavGroup({ title, className, children, ...props }: SideNavGroupProps) {
  const id = useId();
  return (
    <li data-slot="side-nav-group" className={cn("flex flex-col", className)} {...props}>
      <p id={id} className="px-2.5 pb-2 text-sm text-fg-muted">
        {title}
      </p>
      <ul aria-labelledby={id} className="flex flex-col gap-0.5">
        {children}
      </ul>
    </li>
  );
}

export type SideNavLinkProps = useRender.ComponentProps<"a"> & {
  /** The page this link leads to is the one the reader is on. */
  current?: boolean;
  /**
   * What lies under this page, as `SideNavSubLink`s: its sections, or its subpages. Shown under
   * the current page, or under any page that is `open`.
   */
  sub?: ReactNode;
  /**
   * Show `sub` although this page is not the one being read: the reader is on one of its
   * subpages, which then wears `current` itself.
   */
  open?: boolean;
};

/** One page of the set. For a router's link, pass it as `render`. */
export function SideNavLink({
  current = false,
  sub,
  open = false,
  render,
  className,
  ...props
}: SideNavLinkProps) {
  const link = useRender({
    defaultTagName: "a",
    render,
    props: {
      ...props,
      "data-slot": "side-nav-link",
      "aria-current": current ? "page" : undefined,
      className: cn(
        "flex min-h-8 items-center rounded-md px-2.5 py-1 text-control text-fg-body",
        // Instant, like the highlight of a menu: it follows the pointer without lag.
        "hover:bg-hover hover:text-fg",
        "aria-[current=page]:bg-tint aria-[current=page]:font-medium aria-[current=page]:text-fg",
        "forced-colors:aria-[current=page]:outline forced-colors:aria-[current=page]:-outline-offset-1",
        focusRing,
        className,
      ),
    },
  });
  return (
    <li data-slot="side-nav-item" className="flex flex-col">
      {link}
      {(current || open) && sub ? (
        <ul
          data-slot="side-nav-sub"
          className="mt-1 mb-2 ml-2.5 flex flex-col border-l border-hairline"
        >
          {sub}
        </ul>
      ) : null}
    </li>
  );
}

export type SideNavSubLinkProps = useRender.ComponentProps<"a"> & {
  /** The subpage this link leads to is the one the reader is on. */
  current?: boolean;
};

/**
 * A section or a subpage under a page's link. The subpage being read takes the hairline in the
 * text colour, as the `TableOfContents` marks the section being read. For a router's link, pass
 * it as `render`.
 */
export function SideNavSubLink({
  current = false,
  render,
  className,
  ...props
}: SideNavSubLinkProps) {
  const link = useRender({
    defaultTagName: "a",
    render,
    props: {
      ...props,
      "data-slot": "side-nav-sub-link",
      "aria-current": current ? "page" : undefined,
      className: cn(
        "-ml-px flex min-h-7 items-center rounded-r-xs border-l border-transparent py-0.5 pl-3.5 text-sm text-fg-muted hover:border-line hover:text-fg",
        "aria-[current=page]:border-fg aria-[current=page]:font-medium aria-[current=page]:text-fg",
        "forced-colors:aria-[current=page]:border-[Highlight]",
        focusRing,
        className,
      ),
    },
  });
  return <li data-slot="side-nav-sub-item">{link}</li>;
}
