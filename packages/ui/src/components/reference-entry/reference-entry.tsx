import type { ComponentProps } from "react";

import { AnchorHeading, type AnchorHeadingProps } from "@/components/anchor-heading/anchor-heading";
import { cn } from "@/lib/cn";

/**
 * One entry of a reference: a function, a command, an endpoint, a tool. Entries follow one
 * another under hairlines, without cards: a reference is read down the page and searched with
 * the browser, so every entry is open and can be linked to.
 *
 * Put a `ReferenceEntryHeader` (its name, a title in words, and what kind of thing it is as
 * `Badge`s in a `ReferenceEntryMeta`), then a `ReferenceEntryBody` with the description and a
 * `ParameterList`.
 */
export function ReferenceEntry({ className, ...props }: ComponentProps<"article">) {
  return (
    <article
      data-slot="reference-entry"
      className={cn("flex flex-col gap-5 border-t border-hairline pt-7 pb-2", className)}
      {...props}
    />
  );
}

/** The name, the title and the facts about the entry, at the top. */
export function ReferenceEntryHeader({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      data-slot="reference-entry-header"
      className={cn("flex flex-col items-start gap-2", className)}
      {...props}
    />
  );
}

/**
 * The name as it is written in code, as an anchored heading: the address of the entry is
 * `#name`. Give the id the name itself, so links from elsewhere can be written by hand.
 */
export function ReferenceEntryName({ level = 3, className, ...props }: AnchorHeadingProps) {
  return (
    <AnchorHeading
      data-slot="reference-entry-name"
      level={level}
      size="label"
      className={cn(
        "font-mono text-[1.0625rem] leading-6 font-medium [overflow-wrap:anywhere] [font-variant-ligatures:none]",
        className,
      )}
      {...props}
    />
  );
}

/** What the entry does, in words: its title for people. */
export function ReferenceEntryTitle({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="reference-entry-title"
      className={cn("text-base font-medium text-pretty text-fg", className)}
      {...props}
    />
  );
}

/** What kind of thing the entry is: badges for its tier, its traits, its version. */
export function ReferenceEntryMeta({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="reference-entry-meta"
      className={cn("flex flex-wrap items-center gap-1.5 pt-1", className)}
      {...props}
    />
  );
}

/** The description and the parameters, in the rhythm of running text. */
export function ReferenceEntryBody({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="reference-entry-body"
      className={cn("flex min-w-0 flex-col gap-4 text-base text-pretty text-fg-body", className)}
      {...props}
    />
  );
}
