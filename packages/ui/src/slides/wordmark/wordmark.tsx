import type { CSSProperties } from "react";

import { WORDMARK_DOT, WORDMARK_LETTERS, WORDMARK_WIDTH } from "@/components/logo/logo-paths";

export type WordmarkProps = {
  /** 24 in the footer row (default), 32 on a cover or closing slide. */
  size?: 24 | 32;
  /** Placement only, e.g. a pinned position. */
  style?: CSSProperties;
};

/**
 * The wordmark in the two sizes a deck uses: drawn at 32px, live text in the footer row.
 *
 * Always the full word `Lanfermann.dev`, sentence case, the dot in the accent. At 32px it is the
 * drawn logo, an inline `<svg>` of two paths (letters in the text colour, dot in the accent), and
 * both follow the slide's ground. In the footer row it is live text in weight 700. Never
 * capitals, never tracked, never a second colour, never beside the symbol. Outside a deck use
 * the `Wordmark` of the main entry or the SVG files of the brand.
 */
export function Wordmark({ size = 24, style }: WordmarkProps) {
  if (size >= 32) {
    // The drawn word has its own width: a pinned position may carry one, it does not apply.
    const { width: _width, ...placement } = style ?? {};
    return (
      <svg
        data-slot="slide-wordmark"
        role="img"
        aria-label="Lanfermann.dev"
        // The kit's em box: baseline at 0, 800 above it and 200 below.
        viewBox={`0 -800 ${WORDMARK_WIDTH} 1000`}
        width={Math.round(WORDMARK_WIDTH * size) / 1000}
        height={size}
        className="flex-none"
        style={placement}
      >
        <path d={WORDMARK_LETTERS} className="fill-fg" />
        <path d={WORDMARK_DOT} className="fill-accent" />
      </svg>
    );
  }
  return (
    <p
      data-slot="slide-wordmark"
      className="text-slide-meta leading-none font-bold tracking-[-0.1px] text-fg"
      style={style}
    >
      Lanfermann<span className="text-accent">.</span>dev
    </p>
  );
}
