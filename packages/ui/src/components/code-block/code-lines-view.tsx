import type { ComponentProps, CSSProperties } from "react";

import { splitRuns } from "./line-diff";
import { type LineKind, lineKinds, type LineSpec } from "./lines";

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

/** One line as it is drawn. */
export type CodeRow = {
  /** What the line is known by. A block whose code never changes uses its position. */
  key: string | number;
  tokens: readonly CodeToken[];
  kind: LineKind;
  /**
   * A line a change took out, closing where it stood (`CodeBlockLive`). It is no longer part of
   * the code: hidden from assistive tech, not counted, never copied.
   */
  leaving?: boolean;
  /**
   * What a change put into the line: `[start, end)` of its text. The stamp is new with every
   * change, so the part arrives as new and shows it (code.css).
   */
  fresh?: { range: [number, number]; stamp: number };
};

type CodeRowsProps = Pick<
  CodeLinesOptions,
  "lineNumbers" | "wrap" | "addedLabel" | "removedLabel"
> &
  Omit<ComponentProps<"code">, "children"> & { rows: readonly CodeRow[] };

/**
 * The lines of a block once they are coloured: a `<code>` of one span per line, each run in its
 * colour. It only draws. Whoever coloured the lines (the highlighter in `CodeLines`, an app in
 * `CodeBlockLive`) is not its business, and no highlighter may be imported here: this is the
 * half that may travel to the browser.
 */
export function CodeLinesView({
  lines,
  marked,
  added,
  removed,
  ...options
}: CodeLinesOptions & { lines: readonly (readonly CodeToken[])[] }) {
  const kinds = lineKinds(lines.length, { marked, added, removed });
  return (
    <CodeRows
      // A block that is drawn once: a line's position is its identity.
      rows={lines.map((tokens, index) => ({ key: index, tokens, kind: kinds[index] }))}
      {...options}
    />
  );
}

/**
 * The `<code>` itself, from rows that may carry an identity, a line on its way out and the part
 * a change put in. `CodeLinesView` draws code that stands; `CodeLinesLive` code that changes.
 *
 * A line is a grid of one row around its body, so the row can open from nothing and close to
 * nothing (`grid-template-rows`, code.css) while the lines below make room.
 */
export function CodeRows({
  rows,
  lineNumbers = false,
  wrap = false,
  addedLabel = "hinzugefügt",
  removedLabel = "entfernt",
  style,
  ...props
}: CodeRowsProps) {
  const changes = rows.some((row) => row.kind === "added" || row.kind === "removed");
  const count = rows.filter((row) => !row.leaving).length;
  const digits = lineNumbers ? String(count).length : 0;
  // The gutter: numbers, then the sign of a change, each followed by its own gap.
  const numberRoom = lineNumbers ? `${digits}ch + 1.25rem` : "0px";
  const signRoom = changes ? "1ch + 0.75rem" : "0px";
  const measures = {
    "--code-digits": `${digits}ch`,
    "--code-sign-at": `calc(${numberRoom})`,
    "--code-gutter": `calc(${numberRoom} + ${signRoom})`,
    ...style,
  } as CSSProperties;

  return (
    <code
      data-slot="code-block-code"
      data-line-numbers={lineNumbers ? "" : undefined}
      data-wrap={wrap ? "" : undefined}
      style={measures}
      {...props}
    >
      {rows.map(({ key, tokens, kind, leaving, fresh }) => {
        // An empty run would draw nothing; without it an empty line keeps its height (code.css).
        const runs = tokens.filter((token) => token.content !== "");
        const pieces = fresh ? splitRuns(runs, fresh.range) : runs;
        return (
          <span
            key={key}
            data-slot="code-block-line"
            data-kind={kind}
            data-motion={leaving ? "leave" : undefined}
            // Which line has closed, when its transition ends (CodeLinesLive).
            data-row={leaving ? key : undefined}
            data-label={
              kind === "added" ? addedLabel : kind === "removed" ? removedLabel : undefined
            }
            aria-hidden={leaving || undefined}
          >
            <span data-slot="code-block-line-body">
              {pieces.map((piece, at) => {
                const isFresh = "fresh" in piece && piece.fresh;
                return (
                  <span
                    key={isFresh ? `fresh-${fresh?.stamp}-${at}` : at}
                    data-slot={isFresh ? "code-block-fresh" : undefined}
                    style={{
                      color: piece.color,
                      fontStyle: piece.italic ? "italic" : undefined,
                      fontWeight: piece.bold ? 600 : undefined,
                    }}
                  >
                    {piece.content}
                  </span>
                );
              })}
            </span>
          </span>
        );
      })}
    </code>
  );
}
