import { CommandLineIcon, FileBracesIcon, FileCodeIcon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";

import type { IconSvgElement } from "@/components/icon/icon";

import { CodeBlockFrame } from "./code-block-frame";
import type { CodeKeyOptions } from "./code-keys";
import { CodeLines, type CodeLinesOptions } from "./code-lines";
import { type CodeLanguage, isShell } from "./highlight";
import { codeFileName, copyText, trimCode } from "./lines";

/*
 * Server-safe: no "use client". Rendered in a Server Component, the highlighting happens on the
 * server and only the coloured lines travel; the frame around them is the client part.
 */

/** The symbol in a block's header: a prompt for a shell, braces for data, a code file otherwise. */
export function codeSymbol(language: CodeLanguage): IconSvgElement {
  if (isShell(language)) return CommandLineIcon;
  if (language === "json" || language === "yaml" || language === "yml") return FileBracesIcon;
  return FileCodeIcon;
}

export type CodeBlockProps = CodeLinesOptions &
  CodeKeyOptions & {
    /** The code, as it is in the file. One trailing line break is ignored. */
    code: string;
    language?: CodeLanguage;
    /** The file name, set in the header with its symbol. Without it the block has no header. */
    title?: string;
    /** A symbol other than the language's own. */
    icon?: IconSvgElement;
    /** A mark of your own in place of the symbol: the logo of the product the code is for. */
    mark?: ReactNode;
    /** The name of the scrolling region when there is no title. */
    label?: string;
    /**
     * Show this many lines and fold the rest behind a trigger that names them. A fold that would
     * hide a single line is not made.
     */
    fold?: number;
    /** The trigger of the fold, named after what it opens. Gets the number of hidden lines. */
    foldLabel?: (hidden: number) => string;
    className?: string;
  };

/**
 * A block of code as it is read in documentation: coloured like the ground it stands on, with
 * its file name above it and a copy button that confirms with a drawn tick. Long lines scroll
 * inside the block; long code can be folded. A shell command on one line becomes a single row
 * with a prompt.
 *
 * Mark the lines a text talks about (`marked`), show a change with `added` and `removed`, and
 * keep the file name as it is (`quote-form.tsx`). For a word in running text, use `Code`.
 *
 * Two more keys can stand beside the copy. `download` saves the code as a file: for a whole file
 * a reader will keep, such as a configuration. `wrapToggle` lets the reader break long lines
 * and put them back: for code with long lines that are read, not run.
 */
export function CodeBlock({
  code,
  language = "text",
  title,
  icon,
  mark,
  label,
  fold,
  foldLabel,
  className,
  lineNumbers,
  marked,
  added,
  removed,
  wrap,
  addedLabel,
  removedLabel,
  ...keyOptions
}: CodeBlockProps) {
  const lineCount = trimCode(code).split("\n").length;
  const prompt = isShell(language) && lineCount === 1 && !title;
  return (
    <CodeBlockFrame
      copyText={copyText(code, removed)}
      lineCount={lineCount}
      title={title}
      icon={icon ?? codeSymbol(language)}
      mark={mark}
      prompt={prompt}
      label={label}
      fold={fold}
      foldLabel={fold === undefined ? undefined : foldLabel?.(lineCount - fold)}
      className={className}
      fileName={codeFileName(title, language)}
      wrap={wrap}
      {...keyOptions}
    >
      <CodeLines
        code={code}
        language={language}
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
