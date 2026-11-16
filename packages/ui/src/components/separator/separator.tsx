"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cva, type VariantProps } from "class-variance-authority";

import { mergeClassName } from "@/lib/cn";

const separatorVariants = cva(
  "shrink-0 data-[orientation=horizontal]:h-(--separator-size) data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-(--separator-size) data-[orientation=vertical]:self-stretch forced-colors:bg-[color:CanvasText]",
  {
    variants: {
      variant: {
        /** A quiet 1px line between rows or groups inside a surface. */
        hairline: "bg-hairline [--separator-size:1px]",
        /** The kit's structural 1px line, visible on its own (3:1). */
        line: "bg-line [--separator-size:1px]",
        /** The 2px rule that opens a block: a line with round ends. */
        rule: "rounded-full bg-rule [--separator-size:2px]",
      },
    },
    defaultVariants: { variant: "hairline" },
  },
);

export type SeparatorProps = SeparatorPrimitive.Props & VariantProps<typeof separatorVariants>;

/**
 * Structure by line instead of by box: a 2px `rule` opens a block of content, 1px lines divide
 * what is inside it. Content that is only read needs no card.
 */
export function Separator({ className, variant, ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      className={mergeClassName(separatorVariants({ variant }), className)}
      {...props}
    />
  );
}
