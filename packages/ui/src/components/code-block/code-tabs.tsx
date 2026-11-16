import type { CodeCopyLabels } from "./code-copy";
import { CodeLines, type CodeLinesOptions } from "./code-lines";
import { CodeTabsFrame } from "./code-tabs-frame";
import type { CodeLanguage } from "./highlight";
import { copyText } from "./lines";

/* Server-safe, like CodeBlock: each tab is highlighted where the block renders. */

export type CodeTab = CodeLinesOptions & {
  /** The tab: a noun of one or two words, often the tool's own name („bun“, „npm“). */
  label: string;
  code: string;
  language?: CodeLanguage;
};

export type CodeTabsProps = CodeCopyLabels & {
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
  className?: string;
};

/**
 * One block, several versions of the same code: the install command for each package manager,
 * or a component and its stylesheet. The tabs sit in the header with their marks; the copy
 * button copies the version that is shown.
 */
export function CodeTabs({
  items,
  group,
  defaultValue,
  label = "Code",
  className,
  ...copyLabels
}: CodeTabsProps) {
  return (
    <CodeTabsFrame
      tabs={items.map((item) => ({
        label: item.label,
        copyText: copyText(item.code, item.removed),
      }))}
      group={group}
      defaultValue={defaultValue}
      label={label}
      className={className}
      {...copyLabels}
    >
      {items.map(({ label: name, code, language = "text", ...lines }) => (
        <CodeLines key={name} code={code} language={language} {...lines} />
      ))}
    </CodeTabsFrame>
  );
}
