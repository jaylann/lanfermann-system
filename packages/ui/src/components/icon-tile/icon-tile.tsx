import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * The plate as class names, shared with `EmptyMedia` so the two stay one cut. No `"use client"`.
 */
export const iconTile = {
  md: "size-10 rounded-lg",
  sm: "size-9 rounded-md",
  face: "flex shrink-0 items-center justify-center bg-surface text-fg-muted inset-ring inset-ring-hairline forced-colors:inset-ring-[CanvasText]",
} as const;

export type IconTileProps = ComponentProps<"span"> & {
  /** `md` (the default) is 40px with an `Icon` at 20; `sm` is 36px with one at 18. */
  size?: "md" | "sm";
};

/**
 * A small plate for a symbol: the mark of an integration in a list, a kind of thing beside its
 * name, the symbol of an empty state. Flat with a hairline, because it is looked at, not
 * pressed. Put an `Icon` or a small logo inside; it is decoration, so the name stands in the
 * text beside it. Server-safe.
 */
export function IconTile({ size = "md", className, ...props }: IconTileProps) {
  return (
    <span
      data-slot="icon-tile"
      data-size={size}
      aria-hidden
      className={cn(iconTile.face, iconTile[size], className)}
      {...props}
    />
  );
}
