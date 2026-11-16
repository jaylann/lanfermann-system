import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export type ShimmerProps = ComponentProps<"span"> & {
  /**
   * The work is going on (the default). Set it to `false` when it is done: the same element
   * then is plain text in the colour around it, so the line does not jump.
   */
  active?: boolean;
};

/**
 * A line of text that names work in progress: a soft light passes through it for as long as the
 * work goes on. Use it where a wait has words ("Zahlungen werden abgeglichen", "Antwort wird
 * geschrieben"), as in the steps of a `Trace`. A wait without words is a `Spinner`; a wait with
 * a known length is a `Progress`.
 *
 * Word it as what is happening, in a few words, and keep it to one line: the light is redrawn
 * on every frame. It is decoration: say that something is busy where assistive tech looks for
 * it (`aria-busy` on the region, a `role="status"` line).
 *
 * The same look is the `shimmer` utility, for text that already has an element.
 */
export function Shimmer({ active = true, className, ...props }: ShimmerProps) {
  return (
    <span
      data-slot="shimmer"
      data-active={active ? "" : undefined}
      className={cn(active && "shimmer", className)}
      {...props}
    />
  );
}
