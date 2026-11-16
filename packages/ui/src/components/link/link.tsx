import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

import { type LinkVariants, linkVariants } from "./link-variants";

export type LinkProps = ComponentProps<"a"> & LinkVariants;

/**
 * A text link: a plain `<a>`, Indigo and underlined. Word it as where it leads ("Alle Angebote
 * ansehen"), never "hier" or "mehr". For a link that should look like a button, style an `<a>`
 * with `buttonVariants()`; for a router's link component, use `linkVariants()`.
 */
export function Link({ className, variant, ...props }: LinkProps) {
  return (
    <a
      data-slot="link"
      data-variant={variant ?? "accent"}
      className={cn(linkVariants({ variant }), className)}
      {...props}
    />
  );
}
