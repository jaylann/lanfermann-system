import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Wordmark } from "@/slides/wordmark/wordmark";

export type CoBrandProps = {
  /** The client's name as text, or their logo as an <img> no taller than the wordmark. */
  partner: ReactNode;
  /** Text size of both sides. */
  size?: 24 | 32;
};

/**
 * Wordmark, a hairline, the client's name: the lockup for a cover made for one client.
 *
 * The wordmark always comes first and both sides have the same height. The client's name is set
 * in regular weight so the two never read as one name. A client logo keeps its own colours;
 * never recolour it into indigo.
 */
export function CoBrand({ partner, size = 32 }: CoBrandProps) {
  const large = size === 32;
  return (
    <div data-slot="slide-co-brand" className="flex items-center gap-6">
      <Wordmark size={size} />
      <div className={cn("w-px bg-line", large ? "h-8" : "h-6")} />
      <p
        // The size comes first: tailwind-merge drops a line height that stands before a size.
        className={cn(
          large ? "text-slide-body" : "text-slide-meta",
          "leading-none font-normal text-fg",
        )}
      >
        {partner}
      </p>
    </div>
  );
}
