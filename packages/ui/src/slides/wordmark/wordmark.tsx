import type { CSSProperties } from "react";

import { WORDMARK_DOT, WORDMARK_LETTERS, WORDMARK_WIDTH } from "@/components/logo/logo-paths";

export type WordmarkProps = {
  /** 24 in the footer row (default), 32 on a cover or closing slide. */
  size?: 24 | 32;
  /** Placement only, e.g. a pinned position. */
  style?: CSSProperties;
};

/**
 * The wordmark in the two sizes a deck uses: 24px in the footer row, 32px on a cover or closing.
 *
 * Always the full word `Lanfermann.dev`, sentence case, the dot in the accent. It is the drawn
 * logo at both sizes, an inline `<svg>` of two paths (letters in the text colour, dot in the
 * accent), and both follow the slide's ground. Never set in a font, never capitals, never
 * tracked, never a second colour, never beside the symbol. Outside a deck use the `Wordmark` of
 * the main entry or the SVG files of the brand.
 *
 * A departure from the kit, which types the word in the footer row: there the drawn L with its
 * cut corner was missing on every slide but the first and the last.
 */
export function Wordmark({ size = 24, style }: WordmarkProps) {
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
