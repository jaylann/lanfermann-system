import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { span } from "@/slides/lib/grid";

export type LeadProps = {
  /** In the muted text colour under a title (default). Set false when it stands alone. */
  muted?: boolean;
  /** Measure in px. Ten columns by default. */
  width?: number;
  /** One or two sentences. */
  children: ReactNode;
};

/**
 * The 48px sentence that carries a title further.
 *
 * One lead per slide and only where the title needs a second sentence. Two lines at most.
 */
export function Lead({ muted = true, width, children }: LeadProps) {
  return (
    <p
      data-slot="slide-lead"
      data-lines={2}
      className={cn("text-slide-lead", muted ? "text-fg-muted" : "text-fg")}
      style={{ width: width ?? span(10) }}
    >
      {children}
    </p>
  );
}
