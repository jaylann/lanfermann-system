import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

import {
  WORDMARK_DOT,
  WORDMARK_LETTERS,
  WORDMARK_SHORT_DOT,
  WORDMARK_SHORT_LETTERS,
  WORDMARK_SHORT_WIDTH,
  WORDMARK_WIDTH,
} from "./logo-paths";

const forms = {
  full: {
    letters: WORDMARK_LETTERS,
    dot: WORDMARK_DOT,
    width: WORDMARK_WIDTH,
    name: "Lanfermann.dev",
  },
  short: {
    letters: WORDMARK_SHORT_LETTERS,
    dot: WORDMARK_SHORT_DOT,
    width: WORDMARK_SHORT_WIDTH,
    name: "Lanfermann",
  },
} as const;

export type WordmarkProps = Omit<ComponentProps<"svg">, "children" | "viewBox"> & {
  /** `full` is "Lanfermann.dev"; `short` is "Lanfermann." for where the address does not fit. */
  variant?: keyof typeof forms;
  /**
   * The text height in pixels, as if the word were set in type at that size: the capital L is
   * two thirds of it. The kit's sizes; 16 is the smallest the logo may be.
   */
  size?: 16 | 20 | 24 | 32;
};

/**
 * The wordmark: the drawn word "Lanfermann.dev", its dot in the accent. It takes its colours
 * from the ground it stands on (letters in the text colour, the dot in the accent), which gives
 * the kit's three versions without choosing one: dark with an Indigo dot on Paper and Tint, light
 * with a lavender dot on Ink, all white on Indigo.
 *
 * Keep the height of its capital L free on every side. Never beside the `Logomark` (it would
 * read "L Lanfermann"), never recoloured, outlined, rotated, boxed or set in a font instead.
 */
export function Wordmark({ variant = "full", size = 24, className, ...props }: WordmarkProps) {
  const form = forms[variant];
  return (
    <svg
      data-slot="wordmark"
      role="img"
      aria-label={form.name}
      // The kit's em box: baseline at 0, 800 above it and 200 below.
      viewBox={`0 -800 ${form.width} 1000`}
      width={(size * form.width) / 1000}
      height={size}
      className={cn("shrink-0 text-fg", className)}
      {...props}
    >
      <path d={form.letters} fill="currentColor" />
      <path d={form.dot} className="fill-accent" />
    </svg>
  );
}
