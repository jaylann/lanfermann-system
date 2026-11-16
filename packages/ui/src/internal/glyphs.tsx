import type { SVGProps } from "react";

import { cn } from "@/lib/cn";

/**
 * The structural glyphs: the handful of marks that sit INSIDE controls at 10 to 12px, where a
 * library icon turns to mush. They are drawn here, with mitred joins and butt ends like the logo's
 * mitre, and they take `currentColor`. Everything else is an `Icon`.
 */
type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Glyph({ className, children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      data-slot="glyph"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="miter"
      strokeLinecap="butt"
      aria-hidden
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

/** `pathLength={1}` lets a control draw the tick with `stroke-dashoffset` from 1 to 0. */
export function TickGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2.25 6.4 4.9 9 9.75 3.25" pathLength={1} />
    </Glyph>
  );
}

export function DashGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2.5 6h7" pathLength={1} />
    </Glyph>
  );
}

export function ChevronDownGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2.5 4.25 6 7.75 9.5 4.25" />
    </Glyph>
  );
}

export function ChevronRightGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4.25 2.5 7.75 6 4.25 9.5" />
    </Glyph>
  );
}

export function ChevronLeftGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M7.75 2.5 4.25 6 7.75 9.5" />
    </Glyph>
  );
}

export function CloseGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2.75 2.75 9.25 9.25M9.25 2.75 2.75 9.25" />
    </Glyph>
  );
}

/** The steppers of a number field. */
export function PlusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M6 2.5v7M2.5 6h7" />
    </Glyph>
  );
}

export function MinusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M2.5 6h7" />
    </Glyph>
  );
}

/** The direction mark of a sortable column: up is ascending; turned, descending. */
export function ArrowUpGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M6 10V2.75M2.5 6 6 2.5 9.5 6" />
    </Glyph>
  );
}
