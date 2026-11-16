import type { ComponentProps } from "react";

import { containerVariants } from "@/components/container/container";
import { ScrollFade } from "@/internal/scroll-fade";
import { cn } from "@/lib/cn";

/**
 * The frame of a documentation page, inside the width of the site so its columns line up with
 * the `SiteHeader` above and the `SiteFooter` below: the pages of the set on the left, the text
 * in the middle, the page's sections on the right.
 *
 * The side columns stay in view while the text scrolls, below a sticky bar of the height in
 * `--docs-top` (4rem: the `SiteHeader`'s bar, 8px off the top and 56px tall). A side column
 * longer than the window scrolls inside itself, and fades at the end that has more. The pages
 * column shows from `lg`, the sections column from `xl`; below that, the pages go into the
 * site's menu and the sections fold above the text.
 */
export function DocsLayout({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="docs-layout"
      className={cn(
        containerVariants(),
        "grid [--docs-top:4rem] lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-x-10 xl:grid-cols-[13.5rem_minmax(0,1fr)_12rem]",
        className,
      )}
      {...props}
    />
  );
}

// `scroll-py-10`: a link that takes the keyboard focus is scrolled clear of the fade
// (scroll-fade.css), and so is the section the `TableOfContents` brings into view.
const sticky =
  "sticky top-(--docs-top) max-h-[calc(100dvh-var(--docs-top))] scroll-py-10 self-start overflow-y-auto overscroll-contain [scrollbar-width:thin]";

/** The pages of the set: a `SideNav`. Hidden below `lg`. */
export function DocsLayoutNav({ className, ...props }: ComponentProps<"div">) {
  return (
    <ScrollFade
      axis="y"
      data-slot="docs-layout-nav"
      // The padding on the right keeps the focus outline of a link inside the scrolling box.
      // `pt-10` like the main column, so the first group's name stands on the line of the
      // page's first line.
      className={cn(sticky, "-ml-2.5 hidden pt-10 pr-1 pb-10 pl-2.5 lg:block", className)}
      {...props}
    />
  );
}

/** The text of the page. It is the page's `<main>`; give it an id for the skip link. */
export function DocsLayoutMain({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      data-slot="docs-layout-main"
      className={cn("min-w-0 pt-8 pb-16 lg:pt-10", className)}
      {...props}
    />
  );
}

/** The sections of the page: a `TableOfContents`. Hidden below `xl`. */
export function DocsLayoutAside({ className, ...props }: ComponentProps<"div">) {
  return (
    <ScrollFade
      axis="y"
      data-slot="docs-layout-aside"
      className={cn(sticky, "hidden pt-10 pb-10 pl-1 xl:block", className)}
      {...props}
    />
  );
}
