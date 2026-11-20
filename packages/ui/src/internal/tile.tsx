import type { ReactNode } from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { cn } from "@/lib/cn";

export type TileProps = {
  /** The symbol in the tile. */
  icon?: IconSvgElement;
  /** Or a mark of its own (a logo, a glyph), at an 18px symbol's size. */
  children?: ReactNode;
  className?: string;
};

/**
 * The small square a row's symbol stands in, before its title and its line (the pages of a
 * `NavigationMenu` panel, the rows of a `CopyPage` menu): a small raised plug, 36px with an 18px
 * symbol, as in Clerk's menus (Justin, 2026-11-20, chosen over a flat square and over 32px).
 * The symbol is muted and darkens with the row under the pointer or the keyboard: give the row
 * `group/row`.
 */
export function Tile({ icon, children, className }: TileProps) {
  return (
    <span
      aria-hidden
      data-slot="tile"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md bg-raised depth-plug text-fg-muted",
        "group-hover/row:text-fg group-data-highlighted/row:text-fg",
        className,
      )}
    >
      {icon ? <Icon icon={icon} size={18} /> : children}
    </span>
  );
}
