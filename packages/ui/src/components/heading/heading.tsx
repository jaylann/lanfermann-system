import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const headingVariants = cva("text-balance text-fg", {
  variants: {
    size: {
      // The two large sizes step down one on a phone, where a line holds half as many letters.
      /** 54px: one per page at most, on a landing view. 36px on a phone. */
      display: "text-3xl font-medium max-sm:text-2xl",
      /** 36px: the title of a page. 24px on a phone. */
      title: "text-2xl font-medium max-sm:text-xl",
      /** 24px: a section, usually under a rule. */
      section: "text-xl font-semibold",
      /** 20px: a card, a dialog, a group. */
      sub: "text-lg font-semibold",
      /** 16px: a label-sized heading inside dense content. */
      label: "text-base font-semibold",
    },
  },
});

const sizeForLevel = { 1: "title", 2: "section", 3: "sub", 4: "label" } as const;

export type HeadingProps = ComponentProps<"h2"> &
  VariantProps<typeof headingVariants> & {
    /** The outline level, `<h1>` to `<h4>`. It sets the tag; `size` sets the look. */
    level?: 1 | 2 | 3 | 4;
  };

/**
 * A title on the type scale. Write it as a sentence with a full stop ("Bei Lanfermann
 * anmelden."), in sentence case. Pick `level` for the document outline and `size` for the look:
 * they are independent.
 *
 * What opens a page or a section is this and a `Text` under it, set left, with nothing above the
 * title: `size="display"` once, for the page's opening, `size="title"` for every section. Give
 * the title a measure (`max-w-[44rem]`) and the lead a shorter one (`max-w-[34rem]`).
 */
export function Heading({ level = 2, size, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      data-slot="heading"
      className={cn(headingVariants({ size: size ?? sizeForLevel[level] }), className)}
      {...props}
    />
  );
}
