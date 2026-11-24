import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { keepIndent } from "@/slides/code/keep-indent";
import { maxStep, stepAttributes, type StepCounter } from "@/slides/step/steps";

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
  /** Lines that appear at a step: `[{ from: 4, to: 8, step: 1 }]`. Lines not named are there from the start. */
  reveal?: Array<{ from: number; to?: number; step: number }>;
};

/**
 * The step of every line `reveal` names, by its number from 1. A line named twice takes the
 * later entry.
 */
function stepsByLine(reveal: CodeProps["reveal"]): Map<number, number> {
  const steps = new Map<number, number>();
  for (const { from, to = from, step } of reveal ?? []) {
    for (let line = from; line <= to; line++) steps.set(line, step);
  }
  return steps;
}

/**
 * A few lines of literal code in the mono face.
 *
 * The only place the mono face appears at length. No syntax colours: code is `text` on
 * `surface-quiet`, and one line may take the accent. Indentation is kept; long lines are
 * shortened by hand, never wrapped. Each line is its own `<p>` with `white-space:nowrap`, and
 * leading spaces are no-break spaces. Reveal lines by step when the talk explains a listing part
 * by part (the first call, then the second); a listing read at a glance stands whole.
 */
export function Code({ code, caption, highlight, plain = false, width, reveal }: CodeProps) {
  const lines = code.replace(/\n$/, "").split("\n");
  const steps = stepsByLine(reveal);
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
            {...stepAttributes(steps.get(index + 1))}
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

/** The highest step in `reveal`. */
Code.slideSteps = ((props) => maxStep(props.reveal)) satisfies StepCounter<CodeProps>;
