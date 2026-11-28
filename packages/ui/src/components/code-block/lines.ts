/**
 * Lines of a code block, counted from 1 as an editor counts them: `7`, `"2-4,7"`, or
 * `[2, [5, 8]]` (a pair is a range, both ends included).
 */
export type LineSpec = number | string | ReadonlyArray<number | readonly [number, number]>;

/**
 * The lines a spec names. Numbers that are not lines are ignored, not an error. `last` is the
 * last line the code has: a range stops there, so it may be open (`[5, Infinity]`).
 */
export function parseLines(spec: LineSpec | undefined, last = Infinity): Set<number> {
  const lines = new Set<number>();
  if (spec === undefined) return lines;
  const add = (from: number, to: number) => {
    const end = Math.min(Math.max(from, to), last);
    for (let line = Math.max(Math.min(from, to), 1); line <= end; line++) {
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
  const lines = trimCode(code).split("\n");
  const drop = parseLines(removed, lines.length);
  return drop.size === 0 ? lines.join("\n") : lines.filter((_, i) => !drop.has(i + 1)).join("\n");
}

export type LineKind = "marked" | "added" | "removed" | undefined;

/** What each line is. Added and removed win over marked: a change is the stronger fact. */
export function lineKinds(
  count: number,
  { marked, added, removed }: { marked?: LineSpec; added?: LineSpec; removed?: LineSpec },
): LineKind[] {
  const [m, a, r] = [
    parseLines(marked, count),
    parseLines(added, count),
    parseLines(removed, count),
  ];
  return Array.from({ length: count }, (_, i) =>
    r.has(i + 1) ? "removed" : a.has(i + 1) ? "added" : m.has(i + 1) ? "marked" : undefined,
  );
}

/**
 * The file a block of code is saved as when nothing names it: the last part of its title if that
 * is a file's name ("app/api/route.ts" gives "route.ts"), or `code` with the ending of its
 * language.
 */
export function codeFileName(title: string | undefined, language = "text") {
  const name = title?.split(/[/\\]/).pop();
  // A name with an ending and no spaces; a dotfile (".env") is one too.
  if (name && /^\S*\.[A-Za-z0-9]+$/.test(name)) return name;
  const endings: Record<string, string> = {
    text: "txt",
    shell: "sh",
    bash: "sh",
    zsh: "sh",
    typescript: "ts",
    javascript: "js",
    markdown: "md",
    python: "py",
    powershell: "ps1",
    dotenv: "env",
    yml: "yaml",
  };
  return `code.${endings[language] ?? language}`;
}
