"use client";

import { createContext, type ReactNode, useContext } from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { cn } from "@/lib/cn";

/**
 * How the tile of a row's symbol is cut, on the lab board until Justin picks (2026-11-20, from
 * Clerk's menus): `raised`, a small plug with a key's gloss and edge, or `flat`, a hairline
 * square as `CopyPage` had it. And its size: 32px with a 16px symbol, or 36px with an 18px one.
 */
export type TileLook = { look: "raised" | "flat"; size: 32 | 36 };

export const TileLookContext = createContext<TileLook>({ look: "raised", size: 32 });

const looks: Record<TileLook["look"], string> = {
  raised: "bg-raised depth-plug",
  flat: "bg-surface inset-ring inset-ring-hairline forced-colors:inset-ring-[CanvasText]",
};

export type TileProps = {
  /** The symbol in the tile. */
  icon?: IconSvgElement;
  /** Or a mark of its own (a logo, a glyph), at the symbol's size. */
  children?: ReactNode;
  className?: string;
};

/**
 * The small square a row's symbol stands in, before its title and its line (the rows of a
 * `CopyPage` menu, the pages of a `NavigationMenu` panel). The symbol is muted and darkens with
 * the row under the pointer or the keyboard: give the row `group/row`.
 */
export function Tile({ icon, children, className }: TileProps) {
  const { look, size } = useContext(TileLookContext);
  return (
    <span
      aria-hidden
      data-slot="tile"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md text-fg-muted",
        "group-hover/row:text-fg group-data-highlighted/row:text-fg",
        size === 36 ? "size-9" : "size-8",
        looks[look],
        className,
      )}
    >
      {icon ? <Icon icon={icon} size={size === 36 ? 18 : 16} /> : children}
    </span>
  );
}
