import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Source } from "@/slides/source/source";

export type FigureProps = {
  /** The figure alone, e.g. "96". At most four characters. */
  value: ReactNode;
  /** The unit beside it: "%", "Sek.", "von 20". Set apart, smaller, in regular weight and in `text`. */
  unit?: ReactNode;
  /** The source line under the hairline. A figure without a source is not shown. */
  source?: ReactNode;
  /** `start` (default) stands the block on the bottom left, under its title. `end` sets it on the right seven columns; then the slide takes no forms. */
  align?: "start" | "end";
  /** The figure in `accent` (default). Set false when another datum on the slide carries the accent. */
  highlight?: boolean;
  /** What the figure measures, as the rest of the sentence the figure starts. */
  children?: ReactNode;
};

/**
 * One hero figure with its unit, what it measures and where it comes from.
 *
 * One figure per slide, as plain type on the ground: never inside a disc, a ring or a coloured
 * field. The title says what the number means, the caption completes the sentence the number
 * begins („96 % … aller Verbraucher recherchieren lokale Geschäfte online“). The figure is the
 * slide's one accent. Figures use the face's proportional numerals; tabular numerals are for
 * table columns only. Never glue the unit to the figure and never colour the unit.
 */
export function Figure({
  value,
  unit,
  source,
  align = "start",
  highlight = true,
  children,
}: FigureProps) {
  const end = align === "end";
  const block = (
    <div data-slot={end ? undefined : "slide-figure"} className="flex slide-span-7 flex-col gap-8">
      <div className="flex items-baseline gap-4">
        <p className={cn("text-slide-figure font-medium", highlight ? "text-accent" : "text-fg")}>
          {value}
        </p>
        {unit ? (
          <p className="text-slide-statement leading-none font-normal text-fg">{unit}</p>
        ) : null}
      </div>
      {children ? <p className="slide-span-6 text-slide-body text-fg-body">{children}</p> : null}
      {source ? <Source line>{source}</Source> : null}
    </div>
  );
  return end ? (
    <div data-slot="slide-figure" className="flex justify-end">
      {block}
    </div>
  ) : (
    block
  );
}
