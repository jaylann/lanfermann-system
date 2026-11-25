import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Icon } from "@/slides/icon/icon";
import type { IconGlyph } from "@/slides/icon/icons";
import { stepAttributes } from "@/slides/step/steps";

/** What `Columns` and `Steps` draw of an item; each adds the field its label comes from. */
export type ColumnItem = {
  title: ReactNode;
  text?: ReactNode;
  icon?: IconGlyph;
  more?: ReactNode;
  step?: number;
};

type ColumnItemsProps<Item extends ColumnItem> = {
  /** The root's `data-slot`. */
  slot: string;
  items: Item[];
  /** The muted line above an item's title, or nothing. */
  labelOf: (item: Item, index: number) => ReactNode;
};

/**
 * The shared base of `Columns` and `Steps`: equal columns under 2px rules, each with a label, a
 * title and a text. Up to three items are set large (48px titles over 32px text), four and five
 * small (32px strong over 24px). The `more` blocks form a second row of the same grid, so they
 * start on one line whatever the texts above them run to. An item with a `step` appears at it
 * with its rule, and its `more` block with it.
 */
export function ColumnItems<Item extends ColumnItem>({
  slot,
  items,
  labelOf,
}: ColumnItemsProps<Item>) {
  const large = items.length <= 3;
  const hasMore = items.some((item) => item.more != null);
  return (
    <div
      data-slot={slot}
      className={cn("grid", hasMore ? "gap-x-16 gap-y-4" : "gap-16")}
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
    >
      {items.map((item, index) => {
        const label = labelOf(item, index);
        const title = (
          <h3
            className={cn(
              "text-fg",
              large ? "text-slide-lead font-normal" : "text-slide-body leading-[1.3] font-semibold",
            )}
          >
            {item.title}
          </h3>
        );
        return (
          <div
            key={index}
            className={cn("flex flex-col border-t-2 border-rule pt-6", large ? "gap-4" : "gap-2")}
            {...stepAttributes(item.step)}
          >
            {label != null ? <p className="text-slide-meta text-fg-muted">{label}</p> : null}
            {item.icon ? (
              <div className={cn("flex items-center", large ? "gap-4" : "gap-3")}>
                <Icon icon={item.icon} size={large ? 40 : 32} />
                {title}
              </div>
            ) : (
              title
            )}
            {item.text ? (
              <p
                className={large ? "text-slide-body text-fg-body" : "text-slide-meta text-fg-muted"}
              >
                {item.text}
              </p>
            ) : null}
          </div>
        );
      })}
      {hasMore
        ? items.map((item, index) => (
            <div key={`more-${index}`} className="flex flex-col" {...stepAttributes(item.step)}>
              {item.more}
            </div>
          ))
        : null}
    </div>
  );
}
