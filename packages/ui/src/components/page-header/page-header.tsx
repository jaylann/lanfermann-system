import type { ComponentProps, ReactNode } from "react";

import { Heading, type HeadingProps } from "@/components/heading/heading";
import { Text, type TextProps } from "@/components/text/text";
import { cn } from "@/lib/cn";

/**
 * How a page of an app opens, inside its `AppShellMain`: the title (`PageHeaderTitle`), one
 * line on what is there (`PageHeaderDescription`) and what the page does (`PageHeaderActions`)
 * at the right, on the line of the last words. Every page of an app opens this way, which is why
 * it is a part: the `AppShellBar` above holds the way there (`Breadcrumbs`), this holds the page.
 *
 * Nothing stands above the title. What filters or divides the page (chips, a
 * `SegmentedControl`, `Tabs`) stands under it, and the page's blocks follow on `Card`s. A
 * website opens differently from site to site and has no part for it: there a `Heading` and a
 * `Text` open the page.
 *
 * The actions go under the words when the header is narrower than 36rem: its own width, not the
 * window's, so it stacks beside an open sidebar as on a phone. Server-safe.
 */
export function PageHeader({ className, children, ...props }: ComponentProps<"header">) {
  return (
    <header
      data-slot="page-header"
      className={cn("@container/page-header min-w-0", className)}
      {...props}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] @xl/page-header:grid-cols-[minmax(0,1fr)_auto] @xl/page-header:gap-x-6">
        {children}
      </div>
    </header>
  );
}

export type PageHeaderTitleProps = Omit<HeadingProps, "level" | "size"> & {
  /**
   * `section` (24px) on a page in an `AppShell`, the default. `title` (36px, 24px on a phone)
   * for a page that stands without one: a settings page, a setup.
   */
  size?: "section" | "title";
  /**
   * The state of what the page is about, after the title on its line: a `Badge` („Offen“,
   * „Tarif Werkstatt“).
   */
  badge?: ReactNode;
};

/**
 * The page's title, its `<h1>`: what is there, as a sentence with a full stop („Angebote.“,
 * „Angebot A-2026-0418.“). It repeats the last crumb of the bar, and that is right: the bar
 * says where the page is, the title what it is.
 */
export function PageHeaderTitle({
  size = "section",
  badge,
  className,
  ...props
}: PageHeaderTitleProps) {
  return (
    <div
      data-slot="page-header-title"
      className="col-start-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"
    >
      <Heading level={1} size={size} className={cn("min-w-0", className)} {...props} />
      {badge}
    </div>
  );
}

/**
 * One line, two at most, on what the page holds or where things stand: „Zwölf Angebote sind
 * offen, drei warten auf eine Antwort.“ Muted, under the title. With `as="div"` it can carry
 * an `AvatarGroup` before the words.
 */
export function PageHeaderDescription({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="page-header-description"
      tone="muted"
      className={cn("col-start-1 mt-1 max-w-[42rem] text-pretty", className)}
      {...props}
    />
  );
}

/**
 * What the page does: one committed key („Angebot schreiben“) and at most a quieter one beside
 * it. More belongs in a `Menu` behind a key, or on the rows it acts on.
 */
export function PageHeaderActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn(
        "col-start-1 mt-4 flex flex-wrap items-center gap-2",
        // Wide, at the right, standing on the line of the last words.
        "@xl/page-header:col-start-2 @xl/page-header:row-span-2 @xl/page-header:row-start-1 @xl/page-header:mt-0 @xl/page-header:justify-end @xl/page-header:self-end",
        className,
      )}
      {...props}
    />
  );
}
