import type { SVGProps } from "react";

import { cn } from "@/lib/cn";

export type SpinnerProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /** Edge length in px. Match the icon size of the context: 14, 16 or 18. */
  size?: number;
  /** An accessible name ("Angebot wird gesendet"). Without it the spinner is decorative. */
  label?: string;
};

/**
 * Work in progress with no known end: an arc running round an open ring. It is the system's ring
 * before it has closed into a disc. Under reduced motion the arc stands still and breathes.
 *
 * Use it for waits a person started (a button, a panel loading). If the wait has a length, show
 * progress instead; if it is shorter than about 300ms, show nothing.
 */
export function Spinner({ size = 16, label, className, ...props }: SpinnerProps) {
  return (
    <svg
      data-slot="spinner"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      // Like the glyphs: a stroke that stays 1.75px at every size, with butt ends.
      strokeWidth={(1.75 * 16) / size}
      strokeLinecap="butt"
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "shrink-0 motion-safe:animate-spinner motion-reduce:animate-breathe",
        className,
      )}
      {...props}
    >
      <circle cx="8" cy="8" r="6" opacity="0.22" />
      <path d="M8 2a6 6 0 0 1 6 6" />
    </svg>
  );
}
