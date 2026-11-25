import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { keepIndent } from "@/slides/code/keep-indent";

export type CodeProps = {
  /** The code. Twelve lines at most, each under 70 characters at full width. */
  code: string;
  /** One line under the block: the file, the command, what it does. */
  caption?: ReactNode;
  /** Index of the one line set in `accent`. */
  highlight?: number;
  /** Sets the lines in the text face: for a listing that is not literal code (the parts of a prompt, the sections of a file) standing beside code blocks. */
  plain?: boolean;
  /** Block width in px. */
  width?: number;
};

/**
 * A few lines of literal code in the mono face.
 *
 * The only place the mono face appears at length. No syntax colours: code is `text` on
 * `surface-quiet`, and one line may take the accent. Indentation is kept; long lines are
 * shortened by hand, never wrapped. Each line is its own `<p>` with `white-space:nowrap`, and
 * leading spaces are no-break spaces.
 */
export function Code({ code, caption, highlight, plain = false, width }: CodeProps) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <div data-slot="slide-code" className="flex flex-col gap-4" style={{ width }}>
      <div className="flex flex-col rounded-[4px] bg-surface-quiet p-8">
        {lines.map((line, index) => (
          <p
            key={index}
            className={cn(
              "whitespace-nowrap",
              plain ? "text-slide-meta leading-[1.45]" : "font-mono text-slide-code",
              highlight === index ? "text-accent" : "text-fg",
            )}
          >
            {/* An empty line keeps its height. */}
            {keepIndent(line) || " "}
          </p>
        ))}
      </div>
      {caption ? (
        <p data-lines={1} className="text-slide-meta text-fg-muted">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
