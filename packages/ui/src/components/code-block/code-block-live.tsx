import { FileCodeIcon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";

import type { IconSvgElement } from "@/components/icon/icon";

import { CodeBlockFrame } from "./code-block-frame";
import type { CodeCopyLabels } from "./code-copy";
import { type CodeLinesOptions, CodeLinesView, type CodeToken } from "./code-lines-view";
import { parseLines } from "./lines";

/*
 * No highlighter is imported here, and none may be: this file and what it imports are the whole
 * cost of a live block in the browser.
 */

/**
 * What a run of code is, in the ten roles a block colours: the same ones the highlighter of
 * `CodeBlock` uses, so a live block and a highlighted one look alike on every ground.
 */
export type CodeRole =
  | "text"
  | "comment"
  | "punct"
  | "keyword"
  | "string"
  | "number"
  | "function"
  | "type"
  | "attribute"
  | "tag";

/** One run of a line: its text and what it is. Without a role it is plain text. */
export type CodePiece = { text: string; role?: CodeRole };

export type CodeBlockLiveProps = CodeLinesOptions &
  CodeCopyLabels & {
    /** The code, line by line, each line as its runs in order. */
    lines: readonly (readonly CodePiece[])[];
    /** The file name or the place the code goes, set in the header. Without it, no header. */
    title?: string;
    /** The symbol in the header. A code file unless said otherwise. */
    icon?: IconSvgElement;
    /** A mark of your own in place of the symbol: the logo of the product the code is for. */
    mark?: ReactNode;
    /** The name of the scrolling region when there is no title. */
    label?: string;
    /** A shell command on one line: a single row with a prompt before it. */
    prompt?: boolean;
    /** Show this many lines and fold the rest behind a trigger that names them. */
    fold?: number;
    foldLabel?: (hidden: number) => string;
    className?: string;
  };

/**
 * A `CodeBlock` for code that is put together in the browser: a configuration generated from the
 * reader's choices, a command with their own values in it. It looks and behaves like a
 * `CodeBlock` (header, copy with a drawn tick, marked lines, fold), but the app colours the lines
 * itself and hands them over as runs with a role.
 *
 * Why not `CodeBlock`: that one highlights where it renders. On the server that costs the
 * browser nothing; in a client component it would send the highlighter and all its grammars
 * along, about a megabyte for a few lines. So: `CodeBlock` for code that is known when the page
 * is built, `CodeBlockLive` for code that changes under the reader's hand. Mark the lines their
 * choice put there (`marked`), so they see what it changed.
 */
export function CodeBlockLive({
  lines,
  title,
  icon = FileCodeIcon,
  mark,
  label = "Code",
  prompt = false,
  fold,
  foldLabel = (hidden) => `${hidden} weitere Zeilen`,
  className,
  lineNumbers,
  marked,
  added,
  removed,
  wrap,
  addedLabel,
  removedLabel,
  ...copyLabels
}: CodeBlockLiveProps) {
  const coloured: CodeToken[][] = lines.map((line) =>
    line.map((piece) => ({
      content: piece.text,
      color: `var(--lf-code-${piece.role ?? "text"})`,
      italic: piece.role === "comment",
    })),
  );
  // What goes on the clipboard: the code as it stands, without the lines a change removed.
  const dropped = parseLines(removed);
  const text = lines
    .filter((_, index) => !dropped.has(index + 1))
    .map((line) => line.map((piece) => piece.text).join(""))
    .join("\n");

  return (
    <CodeBlockFrame
      copyText={text}
      lineCount={lines.length}
      title={title}
      icon={icon}
      mark={mark}
      prompt={prompt && lines.length === 1 && !title}
      label={label}
      fold={fold}
      foldLabel={fold === undefined ? undefined : foldLabel(lines.length - fold)}
      className={className}
      {...copyLabels}
    >
      <CodeLinesView
        lines={coloured}
        lineNumbers={lineNumbers}
        marked={marked}
        added={added}
        removed={removed}
        wrap={wrap}
        addedLabel={addedLabel}
        removedLabel={removedLabel}
      />
    </CodeBlockFrame>
  );
}
