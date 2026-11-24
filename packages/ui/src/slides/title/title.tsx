import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { span } from "@/slides/lib/grid";

const sizes = {
  title: { className: "text-slide-title", lines: 2 },
  statement: { className: "text-slide-statement", lines: 3 },
  cover: { className: "text-slide-cover", lines: 2 },
} as const;

export type TitleProps = {
  /** 72px for content slides (default), 108px for a statement or section, 162px for the cover. */
  size?: "title" | "statement" | "cover";
  /** Measure in px. Ten columns (1376) by default. */
  width?: number;
  /** The sentence. Break lines by hand with <br /> at a clause boundary. */
  children: ReactNode;
};

/**
 * The slide title in its three sizes: content slide, statement, cover.
 *
 * Write the finding, not the topic: „Ihre Kunden prüfen Sie, bevor sie anrufen.“, not
 * „Kundenverhalten“. Sentence case, a full stop at the end, no colour inside the sentence, no
 * label above it. A slide cannot balance or hyphenate lines, so every title that runs past one
 * line gets a hand-set `<br />`: after a comma or before a conjunction, never after an article or
 * a preposition. Limits: 72px two lines of about 40 characters; 108px three lines of about 26;
 * 162px two lines of about 16.
 */
export function Title({ size = "title", width, children }: TitleProps) {
  const { className, lines } = sizes[size];
  const Heading = size === "cover" ? "h1" : "h2";
  return (
    <Heading
      data-slot="slide-title"
      data-lines={lines}
      className={cn("font-medium text-fg", className)}
      style={{ width: width ?? span(10) }}
    >
      {children}
    </Heading>
  );
}
