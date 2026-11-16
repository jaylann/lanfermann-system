/**
 * Lines of a code block, counted from 1 as an editor counts them: `7`, `"2-4,7"`, or
 * `[2, [5, 8]]` (a pair is a range, both ends included).
 */
export type LineSpec = number | string | ReadonlyArray<number | readonly [number, number]>;

/** The lines a spec names. Numbers that are not lines are ignored, not an error. */
export function parseLines(spec: LineSpec | undefined): Set<number> {
  const lines = new Set<number>();
  if (spec === undefined) return lines;
  const add = (from: number, to: number) => {
    for (let line = Math.min(from, to); line <= Math.max(from, to); line++) {
      if (Number.isInteger(line) && line > 0) lines.add(line);
    }
  };
  if (typeof spec === "number") add(spec, spec);
  else if (typeof spec === "string") {
    for (const part of spec.split(",")) {
      const range = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(part);
      if (range?.[1]) add(Number(range[1]), Number(range[2] ?? range[1]));
    }
  } else {
    for (const part of spec) {
      if (typeof part === "number") add(part, part);
      else add(part[0], part[1]);
    }
  }
  return lines;
}

/** Code as it is shown: one trailing line break is left out, as an editor's last line has one. */
export function trimCode(code: string) {
  return code.replace(/\r\n?/g, "\n").replace(/\n$/, "");
}

/**
 * What the copy button puts on the clipboard: the code as it stands after the change, so the
 * removed lines of a diff are left out. The signs and line numbers are never part of the text.
 */
export function copyText(code: string, removed?: LineSpec) {
  const drop = parseLines(removed);
  const lines = trimCode(code).split("\n");
  return drop.size === 0 ? lines.join("\n") : lines.filter((_, i) => !drop.has(i + 1)).join("\n");
}

export type LineKind = "marked" | "added" | "removed" | undefined;

/** What each line is. Added and removed win over marked: a change is the stronger fact. */
export function lineKinds(
  count: number,
  { marked, added, removed }: { marked?: LineSpec; added?: LineSpec; removed?: LineSpec },
): LineKind[] {
  const [m, a, r] = [parseLines(marked), parseLines(added), parseLines(removed)];
  return Array.from({ length: count }, (_, i) =>
    r.has(i + 1) ? "removed" : a.has(i + 1) ? "added" : m.has(i + 1) ? "marked" : undefined,
  );
}
