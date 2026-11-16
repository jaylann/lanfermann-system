import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export type LogomarkProps = Omit<ComponentProps<"svg">, "children" | "viewBox"> & {
  /** The height of the L in pixels. 16 is the smallest the symbol may be. */
  size?: number;
  /**
   * `duo`: the stem in the text colour, the foot in the accent. `mono`: one colour, for Indigo
   * (where text and accent are both white), a stamp or a one-colour print.
   */
  tone?: "duo" | "mono";
};

/** The two pieces of the mitre, `seam` units apart along the cut. The kit's measures. */
export function logomarkPaths(seam: number) {
  return {
    stem: `M0 ${-seam}L0 -12L3 -12L3 ${-3 - seam}Z`,
    foot: `M${seam} 0L10 0L10 -3L${3 + seam} -3Z`,
  };
}

/**
 * How far the two pieces stand apart. In two tones the colours already tell them apart: the seam
 * is a tenth of the stem from 48px up and closed below, where it would only blur. In one colour
 * the seam is all that separates them, so it is wider, a sixth of the stem, at every size.
 */
export function logomarkSeam(size: number, tone: "duo" | "mono") {
  if (tone === "mono") return 0.35;
  return size >= 48 ? 0.21 : 0;
}

/**
 * The symbol: the mitre, an L in two pieces cut at 45 degrees and joined, the way a frame is
 * built. It stands where the word does not fit: a collapsed sidebar, an avatar, a stamp. For a
 * favicon or an app icon use the files in `@lanfermann/ui/brand`, which sit on their Ink tile.
 *
 * Keep one stem's width free on every side. Never beside the `Wordmark`; on Indigo use
 * `tone="mono"`.
 */
export function Logomark({ size = 24, tone = "duo", className, ...props }: LogomarkProps) {
  const { stem, foot } = logomarkPaths(logomarkSeam(size, tone));
  return (
    <svg
      data-slot="logomark"
      role="img"
      aria-label="Lanfermann"
      viewBox="0 -12 10 12"
      width={(size * 10) / 12}
      height={size}
      className={cn("shrink-0 text-fg", className)}
      {...props}
    >
      <path d={stem} fill="currentColor" />
      <path
        d={foot}
        fill={tone === "mono" ? "currentColor" : undefined}
        className={tone === "mono" ? undefined : "fill-accent"}
      />
    </svg>
  );
}
