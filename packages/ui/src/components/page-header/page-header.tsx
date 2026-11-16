import type { ComponentProps } from "react";

import { Heading, type HeadingProps } from "@/components/heading/heading";
import { Text, type TextProps } from "@/components/text/text";
import { cn } from "@/lib/cn";

export type PageHeaderProps = ComponentProps<"div"> & {
  /**
   * Opens the block with the 2px rule. Every section of a page has one; its opening has none, and
   * neither has a section that a `Seam` opens.
   */
  rule?: boolean;
};

/**
 * What opens a page or one of its sections: a title, then a lead, then what the reader can do.
 * Nothing stands above the title, no label and no number. Everything is set left.
 */
export function PageHeader({ rule = false, className, ...props }: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col items-start gap-4",
        rule && "border-t-2 border-rule pt-6",
        className,
      )}
      {...props}
    />
  );
}

const titleOnAPhone = {
  // One step down the scale where a line holds half as many letters.
  display: "max-sm:text-2xl",
  title: "max-sm:text-xl",
} as const;

export type PageHeaderTitleProps = Omit<HeadingProps, "size"> & {
  /** `display` (54px) once on a page, for its opening. `title` (36px) for every section. */
  size?: keyof typeof titleOnAPhone;
};

/** A sentence with a full stop, in sentence case. It states the thing, not a topic. */
export function PageHeaderTitle({
  level = 2,
  size = "title",
  className,
  ...props
}: PageHeaderTitleProps) {
  return (
    <Heading
      data-slot="page-header-title"
      level={level}
      size={size}
      className={cn("max-w-[44rem]", titleOnAPhone[size], className)}
      {...props}
    />
  );
}

/** One or two sentences under the title, at lines of about 55 characters. */
export function PageHeaderLead({ className, ...props }: TextProps) {
  return (
    <Text
      data-slot="page-header-lead"
      size="lg"
      className={cn("max-w-[34rem] text-pretty", className)}
      {...props}
    />
  );
}

/** The next step: one button, and at most one quiet way beside it. */
export function PageHeaderActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-3 pt-2", className)}
      {...props}
    />
  );
}
