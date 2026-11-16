import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * A word a machine reads, inside running text: a file name, a prop, a command
 * (`bun run dev`). It keeps the size of the sentence around it and breaks with it. For more than
 * a line, use `CodeBlock`.
 */
export function Code({ className, ...props }: ComponentProps<"code">) {
  return (
    <code
      data-slot="code"
      className={cn(
        "rounded-xs border border-hairline bg-well [box-decoration-break:clone] px-[0.3em] font-mono text-[0.84em] text-fg [font-variant-ligatures:none]",
        className,
      )}
      {...props}
    />
  );
}
