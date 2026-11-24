import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Icon } from "@/slides/icon/icon";
import type { IconGlyph } from "@/slides/icon/icons";

export type FigureRowProps = {
  /** Two to four figures. `highlight` puts one of them in `accent`; leave it off the others. `title` names the figure in a muted line above it („Genauigkeit“), with an `icon` from `ICONS` before it if every figure has one; `prefix` is a word or two before a threshold („mehr als“, „unter“). */
  items: Array<{
    value: ReactNode;
    unit?: ReactNode;
    label: ReactNode;
    source?: ReactNode;
    highlight?: boolean;
    title?: ReactNode;
    icon?: IconGlyph;
    prefix?: ReactNode;
  }>;
};

/**
 * Two to four figures in a row, each with its label and its own source.
 *
 * For figures that belong together and are read against each other. Each keeps its own source
 * under its label, because each comes from somewhere else. At most one is highlighted. Four
 * figures is the limit: with more, use a `Table` or a `BarList`.
 */
export function FigureRow({ items }: FigureRowProps) {
  return (
    <div
      data-slot="slide-figure-row"
      className="grid gap-16"
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
    >
      {items.map((item, index) => (
        <div key={index} className="flex flex-col gap-4 border-t-2 border-rule pt-6">
          {item.title ? (
            <div className="flex items-center gap-3">
              {item.icon ? <Icon icon={item.icon} size={28} /> : null}
              <p className="text-slide-meta text-fg-muted">{item.title}</p>
            </div>
          ) : null}
          <div className="flex items-baseline gap-3">
            {item.prefix ? (
              <p className="text-slide-body leading-none text-fg-muted">{item.prefix}</p>
            ) : null}
            <p
              className={cn(
                "text-slide-statement leading-none font-medium",
                item.highlight ? "text-accent" : "text-fg",
              )}
            >
              {item.value}
            </p>
            {item.unit ? <p className="text-slide-lead leading-none text-fg">{item.unit}</p> : null}
          </div>
          <p className="text-slide-body text-fg-body">{item.label}</p>
          {item.source ? <p className="text-slide-meta text-fg-muted">{item.source}</p> : null}
        </div>
      ))}
    </div>
  );
}
