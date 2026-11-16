import type { SVGProps } from "react";

import { cn } from "@/lib/cn";

/*
 * Server-safe: the motion is CSS that listens to the link or button around the arrow
 * (`in-[a:hover,button:hover]`), so no state is needed.
 */

/** The moment the arrow reacts: its link or button is pointed at or holds the keyboard focus. */
const lead =
  "in-[a:hover,button:hover,a:focus-visible,button:focus-visible]:translate-0 in-[a:hover,button:hover,a:focus-visible,button:focus-visible]:spring-snap";
const grow =
  "in-[a:hover,button:hover,a:focus-visible,button:focus-visible]:scale-100 in-[a:hover,button:hover,a:focus-visible,button:focus-visible]:opacity-100";

type ActionArrowProps = Omit<SVGProps<SVGSVGElement>, "children" | "stroke" | "strokeWidth"> & {
  /**
   * `right` leads further into the site; `left` goes back (the page before, in a sequence);
   * `out` (up and right) leaves it: mail, another site.
   */
  direction?: "right" | "left" | "out";
  /** Edge length in px. */
  size?: number;
  /** Stroke in real px: 1.5 beside a label, heavier beside display type. */
  stroke?: number;
};

/**
 * The arrow of an action that leads somewhere. At rest it is a chevron. When its link or button
 * is pointed at, the head moves on and a shaft grows out of it behind, so the chevron becomes an
 * arrow; let go, it seats back (`seat`). On a touch screen, where nothing is pointed at, it is the
 * arrow from the start. Under reduced motion nothing travels: the shaft only fades in.
 *
 * Drawn like the glyphs: mitred joins, butt ends, `currentColor`.
 */
export function ActionArrow({
  direction = "right",
  size = 16,
  stroke = 1.5,
  className,
  ...props
}: ActionArrowProps) {
  const out = direction === "out";
  return (
    <svg
      data-slot="action-arrow"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={(stroke * 16) / size}
      strokeLinejoin="miter"
      strokeLinecap="butt"
      aria-hidden
      // `left` is `right` in a mirror: the head still leads and the shaft grows behind it.
      className={cn("shrink-0 overflow-visible", direction === "left" && "-scale-x-100", className)}
      {...props}
    >
      <path
        data-part="shaft"
        d={out ? "M3.75 12.25 11.5 4.5" : "M2.75 8H12"}
        className={cn(
          "transition-[translate,scale,opacity] spring-seat [transform-box:fill-box]",
          out
            ? "origin-top-right translate-x-[-2px] translate-y-[2px] scale-0"
            : "origin-right translate-x-[-2.5px] scale-x-0",
          lead,
          grow,
          "pointer-coarse:translate-0 pointer-coarse:scale-100",
          "motion-reduce:translate-0 motion-reduce:scale-100 motion-reduce:opacity-0",
          "motion-reduce:in-[a:hover,button:hover,a:focus-visible,button:focus-visible]:opacity-100",
        )}
      />
      <path
        data-part="head"
        d={out ? "M5.75 4.25H11.75V10.25" : "M8.25 4 12.25 8 8.25 12"}
        className={cn(
          "transition-[translate] spring-seat [transform-box:fill-box]",
          out ? "translate-x-[-2px] translate-y-[2px]" : "translate-x-[-2.5px]",
          lead,
          "motion-reduce:translate-0 pointer-coarse:translate-0",
        )}
      />
    </svg>
  );
}
