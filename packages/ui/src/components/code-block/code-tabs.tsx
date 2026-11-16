import type { CodeKeyOptions } from "./code-keys";
import { CodeLines, type CodeLinesOptions } from "./code-lines";
import { CodeTabsFrame } from "./code-tabs-frame";
import type { CodeLanguage } from "./highlight";
import { codeFileName, copyText } from "./lines";

/* Server-safe, like CodeBlock: each tab is highlighted where the block renders. */

export type CodeTab = CodeLinesOptions & {
  /** The tab: a noun of one or two words, often the tool's own name („bun“, „npm“). */
  label: string;
  code: string;
  language?: CodeLanguage;
  /** The file this version is saved as when the block has a download key. */
  fileName?: string;
};

export type CodeTabsProps = Omit<CodeKeyOptions, "download"> & {
  items: CodeTab[];
  /**
   * Blocks with the same group share the reader's choice: picking „bun“ in one shows bun in all
   * of them, and the choice is remembered for the next visit.
   */
  group?: string;
  /** The tab shown first, until the reader picks. The first tab by default. */
  defaultValue?: string;
  /** The name of the tab row, and of each code region after it. */
  label?: string;
  /** Adds a key that saves the version that is shown, as its tab's `fileName`. */
  download?: boolean;
  className?: string;
};

/**
 * One block, several versions of the same code: the install command for each package manager,
 * or a component and its stylesheet. The tabs sit in the header with their marks; the copy
 * button copies the version that is shown, and so do the download and the line wrap when the
 * block has them (see `CodeBlock`).
 */
export function CodeTabs({
  items,
  group,
  defaultValue,
  label = "Code",
  className,
  ...keyOptions
}: CodeTabsProps) {
  return (
    <CodeTabsFrame
      tabs={items.map((item) => ({
        label: item.label,
        copyText: copyText(item.code, item.removed),
        fileName: item.fileName ?? codeFileName(undefined, item.language),
      }))}
      group={group}
      defaultValue={defaultValue}
      label={label}
      // The block starts with broken lines only if every version asks for them.
      wrap={items.every((item) => item.wrap)}
      className={className}
      {...keyOptions}
    >
      {items.map(({ label: name, code, language = "text", fileName: _, ...lines }) => (
        <CodeLines key={name} code={code} language={language} {...lines} />
      ))}
    </CodeTabsFrame>
  );
}
