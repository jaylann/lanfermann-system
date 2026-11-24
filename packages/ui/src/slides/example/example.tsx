import type { ReactNode } from "react";

import { keepIndent } from "@/slides/code/keep-indent";

export type ExampleProps = {
  /** What someone says or types, in quotation marks, at 48px. One line. */
  input: ReactNode;
  /** What the system makes of it, as literal code: a call, a query, a command. Three lines at most. */
  output: string;
  /** The line above, "Beispiel" by default. Pass `null` to leave it out. */
  label?: ReactNode;
  /** One muted line under the output: which model, which setting. */
  caption?: ReactNode;
  /** Block width in px; the measure of the slide by default. */
  width?: number;
};

/**
 * One input in the user's words and the literal output it becomes: a sentence and its tool call.
 *
 * Makes an abstract claim about a system concrete with one real pair of input and output. The
 * input is set as speech, the output as code on `surface-quiet`; nothing is drawn between them,
 * the order says it. One example per slide, on the bottom, under the claim it proves. Use a
 * sentence a user would really say, not a tidy one.
 */
export function Example({ label = "Beispiel", input, output, caption, width }: ExampleProps) {
  return (
    <div
      data-slot="slide-example"
      className="flex flex-col gap-4 border-t-2 border-rule pt-6"
      style={{ width }}
    >
      {label ? <p className="text-slide-meta text-fg-muted">{label}</p> : null}
      <p data-lines={1} className="text-slide-lead text-fg">
        {input}
      </p>
      {/* The row keeps the code block as wide as its longest line, not as wide as the slide. */}
      <div className="flex">
        <div className="flex flex-col rounded-[4px] bg-surface-quiet px-6 py-4">
          {output.split("\n").map((line, index) => (
            <p key={index} className="font-mono text-slide-code whitespace-nowrap text-fg">
              {keepIndent(line)}
            </p>
          ))}
        </div>
      </div>
      {caption ? (
        <p data-lines={1} className="text-slide-meta text-fg-muted">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
