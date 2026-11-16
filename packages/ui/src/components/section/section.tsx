import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const sectionVariants = cva("", {
  variants: {
    space: {
      /** A part that belongs to the one before it. */
      md: "py-10 sm:py-14",
      /**
       * A part of its own: the default between the sections of a page. On a phone two of them
       * stand 96px apart, not 128: the page is read in one long column there, and the air
       * between parts added up to screens (Justin, 2026-11-16).
       */
      lg: "py-12 sm:py-24",
    },
  },
  defaultVariants: { space: "lg" },
});

export type SectionProps = ComponentProps<"section"> & VariantProps<typeof sectionVariants>;

/**
 * One part of a page, with the air above and below it. It is a `<section>`: name it with
 * `aria-labelledby` and the id of its title. Put a `Container` inside, and open it with a
 * `Heading` (`size="title"`), under a `Separator` rule unless a `Seam` opens the section. A part
 * on another ground stands in a `Ground` with the section inside.
 */
export function Section({ space, className, ...props }: SectionProps) {
  return (
    <section data-slot="section" className={cn(sectionVariants({ space }), className)} {...props} />
  );
}
