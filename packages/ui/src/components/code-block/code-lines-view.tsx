import type { CSSProperties } from "react";

import { lineKinds, type LineSpec } from "./lines";

/** One coloured run of a line. `color` is a CSS value: `var(--lf-code-…)`. */
export type CodeToken = { content: string; color?: string; italic?: boolean; bold?: boolean };

export type CodeLinesOptions = {
  /** Numbers before each line. For code someone will talk about by line; off for snippets. */
  lineNumbers?: boolean;
  /** Lines to point at: a tint and the accent along the edge. `"3-5"`, `7` or `[2, [4, 6]]`. */
  marked?: LineSpec;
  /** Lines a change added: a green wash and a plus. */
  added?: LineSpec;
  /** Lines a change removed: a red wash and a minus. They are left out when the code is copied. */
  removed?: LineSpec;
  /** Long lines break instead of scrolling sideways. For prose-like code: Markdown, a log. */
  wrap?: boolean;
  /** What the sign of an added and of a removed line is read out as. */
  addedLabel?: string;
  removedLabel?: string;
};

/**
 * The lines of a block once they are coloured: a `<code>` of one span per line, each run in its
 * colour. It only draws. Whoever coloured the lines (the highlighter in `CodeLines`, an app in
 * `CodeBlockLive`) is not its business, and no highlighter may be imported here: this is the
 * half that may travel to the browser.
 */
export function CodeLinesView({
  lines,
  lineNumbers = false,
  marked,
  added,
  removed,
  wrap = false,
  addedLabel = "hinzugefügt",
  removedLabel = "entfernt",
}: CodeLinesOptions & { lines: readonly (readonly CodeToken[])[] }) {
  const kinds = lineKinds(lines.length, { marked, added, removed });
  const changes = kinds.some((kind) => kind === "added" || kind === "removed");
  const digits = lineNumbers ? String(lines.length).length : 0;
  // The gutter: numbers, then the sign of a change, each followed by its own gap.
  const numberRoom = lineNumbers ? `${digits}ch + 1.25rem` : "0px";
  const signRoom = changes ? "1ch + 0.75rem" : "0px";
  const style = {
    "--code-digits": `${digits}ch`,
    "--code-sign-at": `calc(${numberRoom})`,
    "--code-gutter": `calc(${numberRoom} + ${signRoom})`,
  } as CSSProperties;

  return (
    <code
      data-slot="code-block-code"
      data-line-numbers={lineNumbers ? "" : undefined}
      data-wrap={wrap ? "" : undefined}
      style={style}
    >
      {lines.map((tokens, index) => {
        const kind = kinds[index];
        return (
          <span
            // Lines never move: their position is their identity.
            key={index}
            data-slot="code-block-line"
            data-kind={kind}
            data-label={
              kind === "added" ? addedLabel : kind === "removed" ? removedLabel : undefined
            }
          >
            {tokens.map((token, at) => (
              <span
                key={at}
                style={{
                  color: token.color,
                  fontStyle: token.italic ? "italic" : undefined,
                  fontWeight: token.bold ? 600 : undefined,
                }}
              >
                {token.content}
              </span>
            ))}
          </span>
        );
      })}
    </code>
  );
}
