import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const textVariants = cva("", {
  variants: {
    size: {
      /** 12px: legal lines only. */
      xs: "text-xs",
      /** 13.5px: helper text, captions, metadata. */
      sm: "text-sm",
      /** 16px: body. */
      base: "text-base",
      /** 20px: a lead paragraph under a title. */
      lg: "text-lg",
    },
    tone: {
      body: "text-fg-body",
      strong: "text-fg",
      muted: "text-fg-muted",
      danger: "text-danger",
      warning: "text-warning",
      success: "text-success",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
    /** For strings a machine reads: IBAN, URL, code. */
    mono: { true: "font-mono", false: "" },
    /** For digits that change in place or sit in a numeric column. */
    numeric: { true: "tabular-nums", false: "" },
  },
  defaultVariants: { size: "base", tone: "body", weight: "regular", mono: false, numeric: false },
});

export type TextProps = ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    /** The element to render. A paragraph unless the text sits inside another one. */
    as?: "p" | "span" | "div";
  };

/** Running text on the type scale. For titles use `Heading`. */
export function Text({
  as: Tag = "p",
  size,
  tone,
  weight,
  mono,
  numeric,
  className,
  ...props
}: TextProps) {
  return (
    <Tag
      data-slot="text"
      className={cn(textVariants({ size, tone, weight, mono, numeric }), className)}
      {...props}
    />
  );
}
