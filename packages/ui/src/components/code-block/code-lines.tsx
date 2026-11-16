import { type CodeLinesOptions, CodeLinesView } from "./code-lines-view";
import { type CodeLanguage, highlightLines } from "./highlight";
import { trimCode } from "./lines";

export type { CodeLinesOptions };

/**
 * The highlighted lines of a block: the code is coloured here, where it renders, and drawn by
 * `CodeLinesView`. Server-safe. In a Server Component the highlighter stays on the server and
 * only the coloured spans travel.
 */
export function CodeLines({
  code,
  language,
  ...options
}: CodeLinesOptions & { code: string; language: CodeLanguage }) {
  return <CodeLinesView lines={highlightLines(trimCode(code), language)} {...options} />;
}
