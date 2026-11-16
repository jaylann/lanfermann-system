import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const headingVariants = cva("text-balance text-fg", {
  variants: {
    size: {
      /** 54px: one per page at most, on a landing view. */
      display: "text-3xl font-medium",
      /** 36px: the title of a page. */
      title: "text-2xl font-medium",
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
