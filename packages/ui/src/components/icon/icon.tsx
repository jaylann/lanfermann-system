import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { SVGProps } from "react";

import { cn } from "@/lib/cn";

export type { IconSvgElement };

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref" | "stroke" | "strokeWidth"> & {
  /** An icon from `@hugeicons/core-free-icons`, e.g. `Search01Icon`. */
  icon: IconSvgElement;
  /** Edge length in px. 14 in small controls, 16 in default ones, 18 in large ones. */
  size?: number;
  /**
   * Stroke in real pixels, independent of `size`. 1.5 holds its own beside Sofia Sans at weight
   * 500; change it only for icons set larger than 24px.
   */
  stroke?: number;
  /** An accessible name. Without it the icon is decorative and hidden from assistive tech. */
  label?: string;
};

/**
 * The one way icons enter the system. It pins what makes the set look like ours: a stroke that
 * stays 1.5px at every size, `currentColor`, and no layout shift (the icon never shrinks in a
 * flex row). Icons take the text colour of their context and are never Indigo on their own.
 */
export function Icon({ icon, size = 16, stroke = 1.5, label, className, ...props }: IconProps) {
  return (
    <HugeiconsIcon
      data-slot="icon"
      icon={icon}
      size={size}
      // Hugeicons draws on a 24px grid; scale the stroke so it renders at `stroke` px.
      strokeWidth={(stroke * 24) / size}
      color="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}
