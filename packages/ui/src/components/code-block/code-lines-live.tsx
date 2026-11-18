"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/internal/reduced-motion";

import { type CodeLinesOptions, type CodeRow, CodeRows, type CodeToken } from "./code-lines-view";
import { changedRange, diffLines } from "./line-diff";
import { type LineKind, lineKinds } from "./lines";

/**
 * How a line that joins a live block arrives. While its row opens and pushes the lines below
 * down, the text fades in and drops into place (`unfold`), swings down from its top edge like a
 * flap (`flap`), or slides out from under the line above (`drawer`).
 */
export type CodeLineMotion = "unfold" | "flap" | "drawer";

/** How the part of a line that a change put in shows: it fades in, or also lights up briefly. */
export type CodeChangeMotion = "fade" | "glow";

export type CodeLinesLiveProps = CodeLinesOptions & {
  lines: readonly (readonly CodeToken[])[];
  lineMotion?: CodeLineMotion;
  changeMotion?: CodeChangeMotion;
};

type Line = { id: number; text: string; tokens: readonly CodeToken[]; kind: LineKind };

/** A line a change took out, closing after the row it stood behind (`-1`: at the top). */
type Leaving = Line & { after: number };

type Rows = {
  /** The code as it was last drawn: text, runs and kinds, to notice a change. */
  signature: string;
  lines: Line[];
  leaving: Leaving[];
  /** What a change put into a line, by the line's id. */
  fresh: Map<number, { range: [number, number]; stamp: number }>;
  /** The next id (and stamp) to give out. */
  next: number;
};

/** How long a closing line is kept at most: past the longest transition, in ms. */
const LEAVE_AT_MOST = 1500;

const textOf = (tokens: readonly CodeToken[]) => tokens.map((token) => token.content).join("");

function signatureOf(lines: readonly (readonly CodeToken[])[], kinds: LineKind[]) {
  const runs = lines.map((line) =>
    line.map((token) => `${token.content}\u0001${token.color ?? ""}`).join("\u0002"),
  );
  return `${runs.join("\n")}\u0000${kinds.join(",")}`;
}

function firstRows(
  lines: readonly (readonly CodeToken[])[],
  kinds: LineKind[],
  signature: string,
): Rows {
  return {
    signature,
    lines: lines.map((tokens, id) => ({ id, text: textOf(tokens), tokens, kind: kinds[id] })),
    leaving: [],
    fresh: new Map(),
    next: lines.length,
  };
}

/**
 * The rows after the code changed: a line that goes on keeps its id, a new one gets a new id,
 * and a gone one stays behind the row it followed until it has closed. A line that is on its way
 * out and comes back where it stood takes its id back, so its row turns round instead of
 * opening anew. Under reduced motion nothing is kept on its way out.
 */
function nextRows(
  rows: Rows,
  lines: readonly (readonly CodeToken[])[],
  kinds: LineKind[],
  signature: string,
  still: boolean,
): Rows {
  const texts = lines.map(textOf);
  const { from, removed } = diffLines(
    rows.lines.map((line) => line.text),
    texts,
  );
  let next = rows.next;
  const fresh: Rows["fresh"] = new Map();
  const leaving = still ? [] : [...rows.leaving];
  const ids: number[] = [];

  texts.forEach((text, index) => {
    const before = rows.lines[from[index]!];
    if (before) {
      ids.push(before.id);
      const range = before.text === text ? null : changedRange(before.text, text);
      if (range) fresh.set(before.id, { range, stamp: next++ });
      return;
    }
    const after = index === 0 ? -1 : ids[index - 1]!;
    const back = leaving.findIndex((line) => line.text === text && line.after === after);
    if (back === -1) ids.push(next++);
    else ids.push(...leaving.splice(back, 1).map((line) => line.id));
  });

  if (!still) {
    for (const index of removed) {
      leaving.push({ ...rows.lines[index]!, after: index === 0 ? -1 : rows.lines[index - 1]!.id });
    }
  }

  return {
    signature,
    lines: texts.map((text, index) => ({
      id: ids[index]!,
      text,
      tokens: lines[index]!,
      kind: kinds[index],
    })),
    leaving,
    fresh,
    next,
  };
}

/** The rows in the order they stand: each closing line right after the row it followed. */
function arrange({ lines, leaving, fresh }: Rows): CodeRow[] {
  const rows: CodeRow[] = [];
  const closingAfter = (id: number) => {
    for (const line of leaving) {
      if (line.after !== id) continue;
      rows.push({ key: `r${line.id}`, tokens: line.tokens, kind: line.kind, leaving: true });
      closingAfter(line.id);
    }
  };
  closingAfter(-1);
  for (const line of lines) {
    rows.push({
      key: `r${line.id}`,
      tokens: line.tokens,
      kind: line.kind,
      fresh: fresh.get(line.id),
    });
    closingAfter(line.id);
  }
  return rows;
}

/**
 * The lines of a `CodeBlockLive`: `CodeLinesView` for code that changes under the reader's hand.
 * When the code changes, the lines are matched to the ones before (line-diff.ts). A new line's
 * row opens and pushes the lines below down, a gone line fades and its row closes, and the part
 * of a line that changed shows as new. What stands when the block first shows does not move,
 * and neither does a block that has just mounted (the panel of another tab).
 */
export function CodeLinesLive({
  lines,
  marked,
  added,
  removed,
  lineMotion = "unfold",
  changeMotion = "fade",
  ...options
}: CodeLinesLiveProps) {
  const kinds = lineKinds(lines.length, { marked, added, removed });
  const signature = signatureOf(lines, kinds);
  const still = useReducedMotion();
  const [rows, setRows] = useState(() => firstRows(lines, kinds, signature));
  // The code changed: work out the rows again before anything is drawn (React re-renders at
  // once with them), so the lines that stay keep their element.
  if (rows.signature !== signature) setRows(nextRows(rows, lines, kinds, signature, still));

  // Page load does not animate: only what changes after the block stands moves.
  const [live, setLive] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  /** A closing line has closed: it goes, and what stood behind it stands behind its place. */
  const drop = useCallback((id: number) => {
    setRows((current) => {
      const gone = current.leaving.find((line) => line.id === id);
      if (!gone) return current;
      return {
        ...current,
        leaving: current.leaving
          .filter((line) => line !== gone)
          .map((line) => (line.after === id ? { ...line, after: gone.after } : line)),
      };
    });
  }, []);

  const code = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = code.current;
    if (!element) return;
    const closed = (event: TransitionEvent) => {
      const line = event.target as HTMLElement;
      // A line that came back mid-way is not closing any more: its row turned round.
      if (event.propertyName !== "grid-template-rows" || line.dataset.motion !== "leave") return;
      drop(Number(line.dataset.row?.slice(1)));
    };
    element.addEventListener("transitionend", closed);
    return () => element.removeEventListener("transitionend", closed);
  }, [drop]);

  // A row that cannot finish its transition (its block hidden) is let go all the same.
  useEffect(() => {
    if (rows.leaving.length === 0) return;
    const timer = setTimeout(
      () => setRows((current) => ({ ...current, leaving: [] })),
      LEAVE_AT_MOST,
    );
    return () => clearTimeout(timer);
  }, [rows.leaving]);

  return (
    <CodeRows
      ref={code}
      rows={arrange(rows)}
      data-live={live ? "" : undefined}
      data-line-motion={lineMotion}
      data-change-motion={changeMotion}
      {...options}
    />
  );
}
