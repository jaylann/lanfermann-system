import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * A key on the keyboard, as a small keycap: `<Kbd>⌘</Kbd><Kbd>K</Kbd>`. One key per element; set
 * keys of a shortcut next to each other without a plus sign.
 */
export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-xs bg-raised depth-plug px-1 font-sans text-xs font-medium text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}
