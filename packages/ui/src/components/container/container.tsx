import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * The width of a page as class names, so the bar of a `SiteHeader` and the rows of a `SiteFooter`
 * line up with the content between them. The gutter is added to the width: the content is as wide
 * as the size says, at every window width that has room for it.
 */
export const containerVariants = cva(
  "mx-auto w-full px-(--container-gutter) [--container-gutter:1.25rem] sm:[--container-gutter:2rem]",
  {
    variants: {
      size: {
        /** 72rem: a page, with room for a wide figure beside its reading. */
        page: "max-w-[calc(72rem+2*var(--container-gutter))]",
        /** 48rem: running text, at most about 80 characters of body copy. */
        text: "max-w-[calc(48rem+2*var(--container-gutter))]",
      },
    },
    defaultVariants: { size: "page" },
  },
);

export type ContainerProps = ComponentProps<"div"> & VariantProps<typeof containerVariants>;

/**
 * Centres content at the width of a page and keeps it off the window's edge. Everything on a
 * website stands in one: the sections, and the insides of the header and the footer.
 */
export function Container({ size, className, ...props }: ContainerProps) {
  return (
    <div data-slot="container" className={cn(containerVariants({ size }), className)} {...props} />
  );
}
