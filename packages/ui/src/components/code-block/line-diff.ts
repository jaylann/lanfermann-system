/*
 * Which line of a block became which when its code changed: the one fact a live block needs to
 * let a new line open, a gone one close, and a changed one keep its place. Pure and server-safe.
 */

/** What became of the lines of a block when its code changed. */
export type LineDiff = {
  /** For each line after the change, the line before it that it continues; -1 for a new one. */
  from: number[];
  /** The lines before the change that are gone, by their index before it. */
  removed: number[];
};

/** Above this many cells the table of a full comparison costs more than a frame. */
const MAX_CELLS = 250_000;

/** A line as it is compared: a comma or spaces at its end do not make it another line. */
function shape(line: string) {
  return line.trimEnd().replace(/,$/, "");
}

/**
 * What a line sets, if it sets something: its text up to the first `:` or `=`, indent included
 * (`  "SEVDESK_ALLOW"`, `SEVDESK_ALLOW`, `  -e SEVDESK_ALLOW`). Two lines that set the same thing
 * are one line whose value changed.
 */
function setting(line: string) {
  return /^(\s*[^:=\s][^:=]*?)\s*[:=]/.exec(line)?.[1];
}

/** Whether two lines that differ are still the same line, changed where it stands. */
function changedInPlace(before: string, after: string) {
  const key = setting(before);
  if (key !== undefined) return key === setting(after);
  if (before.trim() === "" || after.trim() === "") return false;
  let shared = 0;
  while (shared < before.length && before[shared] === after[shared]) shared++;
  return shared * 2 >= Math.max(before.length, after.length);
}

/**
 * The pairs of a longest common subsequence of `a[aFrom..aTo)` and `b[bFrom..bTo)` under `same`,
 * in order. Quadratic, so it is only used on code of a page's size.
 */
function commonPairs(
  a: readonly string[],
  b: readonly string[],
  same: (x: string, y: string) => boolean,
  [aFrom, aTo]: [number, number],
  [bFrom, bTo]: [number, number],
): [number, number][] {
  const rows = aTo - aFrom;
  const cols = bTo - bFrom;
  if (rows === 0 || cols === 0) return [];
  // lengths[i][j]: the longest run in a[aFrom + i..) and b[bFrom + j..).
  const width = cols + 1;
  const lengths = new Uint32Array((rows + 1) * width);
  for (let i = rows - 1; i >= 0; i--) {
    for (let j = cols - 1; j >= 0; j--) {
      lengths[i * width + j] = same(a[aFrom + i]!, b[bFrom + j]!)
        ? lengths[(i + 1) * width + j + 1]! + 1
        : Math.max(lengths[(i + 1) * width + j]!, lengths[i * width + j + 1]!);
    }
  }
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (same(a[aFrom + i]!, b[bFrom + j]!)) {
      pairs.push([aFrom + i, bFrom + j]);
      i++;
      j++;
    } else if (lengths[(i + 1) * width + j]! >= lengths[i * width + j + 1]!) i++;
    else j++;
  }
  return pairs;
}

/**
 * Which lines of `after` continue lines of `before`, and which of `before` are gone.
 *
 * Lines are first matched by their text, a trailing comma aside (a line that gains one when a
 * line is added below it stays itself). Between two matches, a line that sets the same thing as
 * one before it (`SEVDESK_ALLOW=read` and `SEVDESK_ALLOW=read,draft`) is that line, changed in
 * place; everything else there is new or gone. Code too long to compare is matched line by line
 * from both ends.
 */
export function diffLines(before: readonly string[], after: readonly string[]): LineDiff {
  const from = Array.from({ length: after.length }, () => -1);
  const kept = new Set<number>();
  const pair = ([i, j]: [number, number]) => {
    from[j] = i;
    kept.add(i);
  };

  if (before.length * after.length > MAX_CELLS) {
    // Too long to compare: the common start and end stay, what lies between is new.
    let start = 0;
    while (start < before.length && start < after.length && before[start] === after[start]) {
      pair([start, start]);
      start++;
    }
    let end = 0;
    while (
      end < before.length - start &&
      end < after.length - start &&
      before[before.length - 1 - end] === after[after.length - 1 - end]
    ) {
      pair([before.length - 1 - end, after.length - 1 - end]);
      end++;
    }
  } else {
    const a = before.map(shape);
    const b = after.map(shape);
    const matches = commonPairs(a, b, (x, y) => x === y, [0, a.length], [0, b.length]);
    // The gaps between matches, and before the first and after the last.
    let [i0, j0] = [0, 0];
    for (const [i, j] of [...matches, [a.length, b.length] as [number, number]]) {
      for (const changed of commonPairs(before, after, changedInPlace, [i0, i], [j0, j])) {
        pair(changed);
      }
      if (i < a.length) pair([i, j]);
      [i0, j0] = [i + 1, j + 1];
    }
  }

  const removed = before.map((_, index) => index).filter((index) => !kept.has(index));
  return { from, removed };
}

/**
 * The part of `after` that is not in `before`: what lies between their common start and common
 * end, as `[start, end)` in `after`. Null when nothing was added (the same text, or only a
 * deletion).
 */
export function changedRange(before: string, after: string): [number, number] | null {
  const most = Math.min(before.length, after.length);
  let start = 0;
  while (start < most && before[start] === after[start]) start++;
  let end = 0;
  while (end < most - start && before[before.length - 1 - end] === after[after.length - 1 - end]) {
    end++;
  }
  return start < after.length - end ? [start, after.length - end] : null;
}

/**
 * The runs of a line, cut where `range` starts and ends, with the runs inside it flagged
 * `fresh`. A run keeps its colour on both sides of a cut.
 */
export function splitRuns<Run extends { content: string }>(
  runs: readonly Run[],
  [start, end]: [number, number],
): (Run & { fresh?: true })[] {
  const pieces: (Run & { fresh?: true })[] = [];
  let at = 0;
  for (const run of runs) {
    const runEnd = at + run.content.length;
    const cuts = [
      at,
      Math.min(Math.max(start, at), runEnd),
      Math.min(Math.max(end, at), runEnd),
      runEnd,
    ];
    for (let k = 0; k < 3; k++) {
      const [from, to] = [cuts[k]!, cuts[k + 1]!];
      if (to <= from) continue;
      const content = run.content.slice(from - at, to - at);
      pieces.push(k === 1 ? { ...run, content, fresh: true } : { ...run, content });
    }
    at = runEnd;
  }
  return pieces;
}
