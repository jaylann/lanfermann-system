import type { ComponentProps } from "react";

import { iconTile } from "@/components/icon-tile/icon-tile";
import { cn } from "@/lib/cn";

export type EmptyProps = ComponentProps<"div"> & {
  /**
   * `page` (the default): the whole content of a page or a large panel. `inline`: inside
   * something else, a table without rows, a card, a list in a sheet.
   */
  size?: "page" | "inline";
};

/**
 * What stands where a list, a table or a page has nothing in it yet. It is read, so it is flat.
 * Put an `EmptyMedia` with a symbol, an `EmptyTitle`, an `EmptyText` and the first step in
 * `EmptyActions` inside.
 *
 * The title is the fact, said to the reader ("Sie haben noch kein Angebot geschrieben."). The
 * text says what will appear here, and when. The button is the first step, the thing and then
 * the action ("Erstes Angebot schreiben"). A search that finds nothing is a different case: one
 * sentence that names the kind of thing that was looked for, and no button.
 */
export function Empty({ size = "page", className, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      data-size={size}
      className={cn(
        "group/empty mx-auto flex w-full max-w-sm flex-col items-center text-center",
        size === "page" ? "gap-2 py-16" : "gap-1.5 py-8",
        className,
      )}
      {...props}
    />
  );
}

export type EmptyMediaProps = ComponentProps<"div"> & {
  /**
   * `tile` (the default): the symbol stands in a small plate with a hairline. `bare`: the
   * symbol alone.
   */
  variant?: "tile" | "bare";
};

/** The symbol above the title: an `Icon` at 20px (18px in an inline one). It is decoration. */
export function EmptyMedia({ variant = "tile", className, ...props }: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-media"
      data-variant={variant}
      aria-hidden
      className={cn(
        "mb-2 flex shrink-0 items-center justify-center text-fg-muted",
        // The plate is the `IconTile`'s, a size smaller in an inline empty state.
        variant === "tile" && [
          iconTile.face,
          iconTile.md,
          "group-data-[size=inline]/empty:size-9 group-data-[size=inline]/empty:rounded-md",
        ],
        className,
      )}
      {...props}
    />
  );
}

export type EmptyTitleProps = ComponentProps<"h2"> & {
  /** The heading level it has in the page's outline. */
  level?: 2 | 3 | 4;
};

/** The fact, as a sentence with its full stop. */
export function EmptyTitle({ level = 2, className, ...props }: EmptyTitleProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      data-slot="empty-title"
      className={cn(
        "leading-snug font-semibold text-balance text-fg",
        "text-lg group-data-[size=inline]/empty:text-control group-data-[size=inline]/empty:font-medium",
        className,
      )}
      {...props}
    />
  );
}

/** What will appear here, and when: one or two sentences. */
export function EmptyText({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-text"
      className={cn(
        "text-pretty text-fg-muted",
        "text-control group-data-[size=inline]/empty:text-sm",
        className,
      )}
      {...props}
    />
  );
}

/** The first step, as a `Button`; a second, quieter way beside it at most. */
export function EmptyActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-actions"
      className={cn(
        "mt-4 flex flex-wrap items-center justify-center gap-2 group-data-[size=inline]/empty:mt-3",
        className,
      )}
      {...props}
    />
  );
}
