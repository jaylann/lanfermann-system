"use client";

import { type ComponentProps, type MouseEvent, type ReactNode, useRef } from "react";

import { Button } from "@/components/button/button";
import { ButtonGroup } from "@/components/button-group/button-group";
import {
  buttonGroupKeyDisabledLook,
  buttonGroupKeyVariants,
} from "@/components/button-group/button-group-variants";
import { ChevronLeftGlyph, ChevronRightGlyph, GapGlyph } from "@/internal/glyphs";
import { useTravellingMark } from "@/internal/travelling-mark";
import { cn } from "@/lib/cn";

/** A gap between page numbers, where pages were left out. */
const GAP = "gap";

/**
 * The page numbers to show: the first and the last, the current one with its neighbours, and a
 * gap where pages are left out. The row always has the same number of places, whatever page is
 * current, so it never changes its width while one pages through.
 */
export function pageRange(page: number, pages: number, siblings = 1): (number | typeof GAP)[] {
  const places = siblings * 2 + 5;
  if (pages <= places) return Array.from({ length: pages }, (_, index) => index + 1);
  const run = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index);
  // Near an end the gap on that side is not needed: its place goes to one more number.
  if (page <= siblings + 3) return [...run(1, places - 2), GAP, pages];
  if (page >= pages - siblings - 2) return [1, GAP, ...run(pages - places + 3, pages)];
  return [1, GAP, ...run(page - siblings, page + siblings), GAP, pages];
}

export type PaginationProps = Omit<ComponentProps<"nav">, "children"> & {
  /** The page that shows, counted from 1. */
  page: number;
  /** How many pages there are. */
  pages: number;
  /**
   * Where a page lives. With it every number is a real link, so a page can be opened in a new
   * tab, sent to someone and found again with the Back button. Keep the page in the address.
   *
   * A pattern in which `{page}` stands for the number (`"/angebote?seite={page}"`), or a
   * function. From a Server Component only the pattern can be handed in.
   */
  href?: string | ((page: number) => string);
  /**
   * Called with the page that was asked for. Without `href` the numbers are buttons and this is
   * all that happens; with it, call `event.preventDefault()` here if a router takes over.
   */
  onPageChange?: (page: number, event: MouseEvent<HTMLElement>) => void;
  /**
   * `numbered` (the default): the pages as numbers, the current one on the tint. `compact`:
   * "Seite 3 von 12" and two arrows, for a narrow place or a list nobody jumps around in.
   */
  variant?: "numbered" | "compact";
  /** How many numbers stand to each side of the current one. */
  siblings?: number;
  /** The name of the navigation for assistive tech. */
  "aria-label"?: string;
  /** What a page number is called: "Seite 3". A pattern (`"Page {page}"`) or a function. */
  pageLabel?: string | ((page: number) => string);
  /**
   * The line of the compact form: "Seite 3 von 12". A pattern (`"Page {page} of {pages}"`) or a
   * function.
   */
  positionLabel?: string | ((page: number, pages: number) => ReactNode);
  /** The name of the arrow that goes one page back. */
  previousLabel?: string;
  /** The name of the arrow that goes one page on. */
  nextLabel?: string;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const place =
  "flex size-(--control-md) items-center justify-center rounded-md text-control tabular-nums select-none";

/**
 * On a touch screen a place grows to 44px up and down, never sideways: its neighbours stand
 * 2px beside it, and two places must not take each other's taps.
 */
const reach =
  "relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-11 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']";

/** A pattern with its numbers put in: `{page}` and `{pages}`. */
function fill(pattern: string, page: number, pages: number) {
  return pattern.replaceAll("{page}", String(page)).replaceAll("{pages}", String(pages));
}

/** An arrow leans a pixel the way it leads while the pointer is on it. */
const lean = "transition-[translate] spring-seat group-hover/arrow:spring-snap";

/**
 * The pages of a long list. The page that shows stands on the tint, and the tint travels to
 * the next number when the page changes. The row keeps its width from the first page to the
 * last, so the arrows stay under the pointer while one pages through.
 *
 * Give it `href` wherever the page is part of the address, which is nearly always: the numbers
 * are then links. Say beside it what the pages hold ("21 bis 40 von 248 Angeboten"); that
 * line is yours to word.
 */
export function Pagination({
  page,
  pages,
  href,
  onPageChange,
  variant = "numbered",
  siblings = 1,
  "aria-label": label = "Seiten",
  pageLabel = "Seite {page}",
  positionLabel = "Seite {page} von {pages}",
  previousLabel = "Vorherige Seite",
  nextLabel = "Nächste Seite",
  className,
  ...props
}: PaginationProps) {
  const list = useRef<HTMLUListElement>(null);
  const mark = useRef<HTMLLIElement>(null);
  useTravellingMark(list, mark, { enabled: variant === "numbered" });

  const hrefOf = (to: number) => (typeof href === "string" ? fill(href, to, pages) : href?.(to));
  const nameOf = (to: number) =>
    typeof pageLabel === "string" ? fill(pageLabel, to, pages) : pageLabel(to);

  /**
   * What an arrow or a number says and does. One that leads nowhere (back from the first page,
   * on from the last) keeps its place, so nothing shifts, and stays in reach of the keyboard:
   * whoever pages to the end with Enter still holds the focus there and hears that it ends.
   */
  const leads = (to: number, name: string) => {
    const off = to < 1 || to > pages;
    return {
      off,
      "aria-label": name,
      "aria-current": to === page ? ("page" as const) : undefined,
      "aria-disabled": off || undefined,
      onClick: (event: MouseEvent<HTMLElement>) => {
        if (off) event.preventDefault();
        else onPageChange?.(to, event);
      },
    };
  };

  /** What makes it a link while it leads somewhere, and says it is one while it does not. */
  const address = (to: number, off: boolean) =>
    off ? { role: "link", tabIndex: 0 } : { href: hrefOf(to) };

  if (variant === "compact") {
    const step = (to: number, name: string, glyph: ReactNode) => {
      const { off, ...says } = leads(to, name);
      // A page with an address is a link, and a link is not drawn through `Button`: it takes
      // the key's look from the group's own recipe.
      return href ? (
        <a
          {...address(to, off)}
          {...says}
          data-slot="button"
          data-group-key=""
          data-disabled={off ? "" : undefined}
          className={cn(
            buttonGroupKeyVariants({ size: "sm", iconOnly: true }),
            buttonGroupKeyDisabledLook,
          )}
        >
          {glyph}
        </a>
      ) : (
        <Button iconOnly disabled={off} focusableWhenDisabled {...says} aria-label={name}>
          {glyph}
        </Button>
      );
    };
    return (
      <nav
        data-slot="pagination"
        data-variant="compact"
        aria-label={label}
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        <span data-slot="pagination-position" className="text-sm text-fg-muted tabular-nums">
          {typeof positionLabel === "string"
            ? fill(positionLabel, page, pages)
            : positionLabel(page, pages)}
        </span>
        <ButtonGroup size="sm" aria-label={label}>
          {step(page - 1, previousLabel, <ChevronLeftGlyph />)}
          {step(page + 1, nextLabel, <ChevronRightGlyph />)}
        </ButtonGroup>
      </nav>
    );
  }

  /** A link where the page has an address, a button where it has none. */
  const go = (to: number, more: { className: string; children: ReactNode; label: string }) => {
    const { off, ...says } = leads(to, more.label);
    return href ? (
      <a {...address(to, off)} {...says} className={more.className}>
        {more.children}
      </a>
    ) : (
      <button type="button" {...says} className={more.className}>
        {more.children}
      </button>
    );
  };

  const arrow = cn(
    place,
    reach,
    "group/arrow text-fg-muted hover:bg-hover hover:text-fg",
    "aria-disabled:pointer-events-none aria-disabled:text-on-disabled",
    focusRing,
  );
  return (
    <nav
      data-slot="pagination"
      data-variant="numbered"
      aria-label={label}
      className={className}
      {...props}
    >
      <ul
        ref={list}
        data-slot="pagination-list"
        // Until the travelling tint has taken over, the current number wears the tint itself.
        className="relative isolate flex items-center gap-0.5 [--pagination-current:var(--lf-tint)] data-placed:[--pagination-current:transparent]"
      >
        <li>
          {go(page - 1, {
            label: previousLabel,
            className: arrow,
            children: (
              <ChevronLeftGlyph
                className={cn(lean, "motion-safe:group-hover/arrow:-translate-x-px")}
              />
            ),
          })}
        </li>
        {pageRange(page, pages, siblings).map((entry, index) =>
          entry === GAP ? (
            // Keyed by its place: the gap before the current page and the one after it.
            <li key={`gap-${index}`} aria-hidden className={cn(place, "text-fg-muted")}>
              <GapGlyph />
            </li>
          ) : (
            <li key={entry}>
              {go(entry, {
                label: nameOf(entry),
                className: cn(
                  place,
                  reach,
                  "text-fg-body hover:text-fg not-aria-[current=page]:hover:bg-hover",
                  "aria-[current=page]:bg-(--pagination-current) aria-[current=page]:font-medium aria-[current=page]:text-fg",
                  "forced-colors:aria-[current=page]:outline forced-colors:aria-[current=page]:-outline-offset-1",
                  focusRing,
                ),
                children: entry,
              })}
            </li>
          ),
        )}
        <li>
          {go(page + 1, {
            label: nextLabel,
            className: arrow,
            children: (
              <ChevronRightGlyph
                className={cn(lean, "motion-safe:group-hover/arrow:translate-x-px")}
              />
            ),
          })}
        </li>
        <li
          ref={mark}
          aria-hidden
          role="presentation"
          data-slot="pagination-mark"
          className="travels -z-10 rounded-md bg-tint"
        />
      </ul>
    </nav>
  );
}
