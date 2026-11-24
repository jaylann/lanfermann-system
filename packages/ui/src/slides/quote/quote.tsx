import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type QuoteProps = {
  /** Who said it. */
  name: ReactNode;
  /** Role and company, and the date if it matters. */
  role?: ReactNode;
  /** 72px for up to three lines (default), 48px for a longer quote. */
  size?: "title" | "lead";
  /** The quote, inside quotation marks: „ “ in German, “ ” in English. */
  children: ReactNode;
};

/**
 * A customer's sentence in display size, signed with name and role.
 *
 * Someone else's voice, so the slide stands on Tint and has no title of its own: the quote is the
 * title. Real quotes from real people, with permission, word for word. No oversized decorative
 * quotation mark, no portrait in a circle.
 */
export function Quote({ name, role, size = "title", children }: QuoteProps) {
  const lead = size === "lead";
  return (
    <figure data-slot="slide-quote" className="flex flex-col gap-12">
      <blockquote
        data-lines={lead ? undefined : 3}
        className={cn(
          "slide-span-10 text-fg",
          lead ? "text-slide-lead" : "text-slide-title font-medium",
        )}
      >
        {children}
      </blockquote>
      <figcaption className="flex slide-span-4 flex-col gap-2 border-t-2 border-rule pt-6">
        {/* A signature, not a heading: the slide has no title, so an <h3> would skip levels. */}
        <p className="text-slide-body leading-[1.3] font-semibold text-fg">{name}</p>
        {role ? <p className="text-slide-meta text-fg-muted">{role}</p> : null}
      </figcaption>
    </figure>
  );
}
