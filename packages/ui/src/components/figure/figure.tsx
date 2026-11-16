import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * A picture that belongs to the text: a diagram, a screenshot, a chart, with a caption under it
 * that says what it shows. Put the picture in a `FigureFrame` when it is drawn on its own ground,
 * then a `FigureCaption`.
 */
export function Figure({ className, ...props }: ComponentProps<"figure">) {
  return (
    <figure
      data-slot="figure"
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    />
  );
}

/**
 * The sheet a drawing stands on, like a code block's: white, a hairline, no shadow. A drawing
 * wider than the column scrolls sideways inside it, never the page.
 */
export function FigureFrame({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="figure-frame"
      className={cn(
        "flex justify-center overflow-x-auto rounded-xl border border-hairline bg-sheet px-5 py-6",
        className,
      )}
      {...props}
    />
  );
}

/** What the picture shows, as a sentence. */
export function FigureCaption({ className, ...props }: ComponentProps<"figcaption">) {
  return (
    <figcaption
      data-slot="figure-caption"
      className={cn("text-sm text-pretty text-fg-muted", className)}
      {...props}
    />
  );
}
