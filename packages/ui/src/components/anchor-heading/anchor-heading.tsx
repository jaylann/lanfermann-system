import { Link04Icon } from "@hugeicons/core-free-icons";

import { Heading, type HeadingProps } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { cn } from "@/lib/cn";

export type AnchorHeadingProps = Omit<HeadingProps, "id" | "level"> & {
  /** The section's id: the part of the address after `#`. */
  id: string;
  /** `<h2>` to `<h4>`: a section of a page and its parts. The page's title is `PageHeaderTitle`. */
  level?: 2 | 3 | 4;
  /** The name of the link to the section, read out by a screen reader. */
  anchorLabel?: string;
};

/**
 * A heading in a long page that can be linked to: a section of the docs, an entry in a
 * reference. A link symbol after its text sets the address to the section, so a reader can copy
 * it and send someone straight there. The symbol shows when the heading is pointed at or the link
 * has the keyboard, so thirty headings do not carry thirty symbols at rest.
 *
 * It stops below a sticky bar when it is jumped to: set `--anchor-offset` (the bar's height and
 * some air) on the page, or `scroll-padding-top` on `<html>`.
 */
export function AnchorHeading({
  id,
  level = 2,
  anchorLabel = "Link zu diesem Abschnitt",
  className,
  children,
  ...props
}: AnchorHeadingProps) {
  return (
    <Heading
      data-slot="anchor-heading"
      id={id}
      level={level}
      className={cn("group/anchor scroll-mt-[var(--anchor-offset,0px)]", className)}
      {...props}
    >
      {children}
      {/* A no-break space keeps the symbol on the line of the last word. */}
      {" "}
      <a
        href={`#${id}`}
        aria-label={anchorLabel}
        data-slot="anchor-heading-link"
        className={cn(
          "touch-target relative inline-flex size-5 items-center justify-center rounded-xs align-middle text-fg-muted",
          "opacity-0 transition-[opacity,color] spring-snap group-hover/anchor:opacity-100 hover:text-fg focus-visible:opacity-100",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        )}
      >
        <Icon icon={Link04Icon} size={16} />
      </a>
    </Heading>
  );
}
