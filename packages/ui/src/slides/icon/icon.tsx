import { cn } from "@/lib/cn";
import type { IconGlyph } from "@/slides/icon/icons";

export type IconProps = {
  /** One of `ICONS` (`ICONS.lock`, `ICONS.database`, `ICONS.timer`, …) or `MARKS` (`MARKS.postgresql`, `MARKS.python`, `MARKS.claude`, …). */
  icon: IconGlyph;
  /** Edge length in px: 28 beside 24px text, 32 beside 32px text, 40 beside a 48px title. 32 by default. */
  size?: number;
};

/**
 * A small icon before a title: a pictogram from `ICONS` in the accent, or a product's mark from
 * `MARKS` in its own colour.
 *
 * Icons are welcome wherever they let a reader find a thing faster than its word does: before the
 * title of a column, a step, a stage, a figure, a contact or a diagram box. The components take
 * them through an `icon` field, so an icon is rarely placed by hand.
 *
 * How. One set (`ICONS`, 46 pictograms in one line weight) and nothing drawn for the occasion.
 * Always small and beside its title, in the accent; a product is shown by its own mark in its own
 * colour (`MARKS`). All items of a set carry one or none does, and the same thing has the same
 * icon through a deck.
 *
 * Where not. Never large, never alone above a column like a tile, never as a bullet, never inside
 * running text or a table cell, never on a cover, statement or closing title. If no icon in the
 * set says the thing, the set goes without icons: a vague icon is worse than none.
 */
export function Icon({ icon, size = 32 }: IconProps) {
  const box = icon.box ?? 24;
  // A product's mark keeps the product's own colour on every ground: the one raw colour here.
  const own = icon.color !== null && icon.color !== "accent" ? icon.color : undefined;
  return (
    <svg
      data-slot="slide-icon"
      role="img"
      aria-label={icon.name}
      width={size}
      height={size}
      viewBox={`0 0 ${box} ${box}`}
      className="flex-none"
    >
      <path
        d={icon.path}
        className={cn(icon.color === "accent" && "fill-accent", icon.color === null && "fill-fg")}
        style={own === undefined ? undefined : { fill: own }}
      />
    </svg>
  );
}
