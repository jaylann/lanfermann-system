/**
 * A deck's code in memory: its `.ts` and `.tsx` files by their path inside the deck's folder
 * (relative, with forward slashes). What `bundleDeck` and `typecheckDeck` take, so a server can
 * check and build a deck it never wrote to a disk.
 */
export type DeckInput = {
  files: Record<string, string>;
  /** The path of the file whose default export is the `<Deck>`: `deck.tsx`. */
  entry: string;
};

/**
 * A deck as its folder holds it: the code, and the pictures beside it by the same kind of path.
 * What the command line reads, checks and packs.
 */
export type DeckSource = DeckInput & {
  images: Record<string, Uint8Array>;
};

/**
 * What is wrong with a deck, as `bundleDeck` and `typecheckDeck` report it: an import outside
 * the allowlist, code that does not parse, a type that does not hold, or notes that cannot be
 * left out for certain.
 */
export type DeckError = {
  kind: "import" | "syntax" | "type" | "notes";
  /** The file's path inside the deck. */
  file?: string;
  /** Counted from 1. */
  line?: number;
  /** Counted from 1. */
  column?: number;
  message: string;
  /** The finer code the command line prints: `import-not-allowed`, `ts2322`. */
  code?: string;
};

/** What `bundleDeck` hands back. `js` is there only when `ok` is true. */
export type BundleResult = {
  ok: boolean;
  /** The deck as one script that sets `globalThis.__LF_DECK__`. */
  js?: string;
  /** The version of `@lanfermann/ui` the bundle was built against: the player it needs. */
  kitVersion: string;
  errors: DeckError[];
};

export type Severity = "error" | "warning";

/** One thing the command line's check has to say about a deck, at a place in one of its files. */
export type Diagnostic = {
  /** The file's path inside the deck. */
  file: string;
  /** Counted from 1. */
  line: number;
  /** Counted from 1. */
  column: number;
  /** Stable, for a tool that reads the list: `import-not-allowed`, `ts2322`, `layout-wrap`. */
  code: string;
  message: string;
  severity: Severity;
};

/** A `DeckError` as a line of the check: without a place it stands at the head of the entry. */
export function diagnosticOf(error: DeckError, entry: string): Diagnostic {
  return {
    file: error.file ?? entry,
    line: error.line ?? 1,
    column: error.column ?? 1,
    code: error.code ?? error.kind,
    message: error.message,
    severity: "error",
  };
}

/** `deck.tsx:2:20 error import "lodash" is not allowed (import-not-allowed)` */
export function formatDiagnostic(diagnostic: Diagnostic): string {
  const { file, line, column, severity, message, code } = diagnostic;
  return `${file}:${line}:${column} ${severity} ${message} (${code})`;
}

/** Whether a list holds anything that stops a build. */
export function hasErrors(diagnostics: readonly Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

/**
 * A piece of a deck's own text inside a message: quoted, with control characters written out
 * (a file name must not be able to write to the terminal) and cut where it grows long.
 */
export function quote(text: string): string {
  const most = 80;
  return JSON.stringify(text.length > most ? `${text.slice(0, most)}…` : text);
}

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** In reading order: by file (the entry first), then by place. The same line is said once. */
export function sortDiagnostics(diagnostics: readonly Diagnostic[], entry: string): Diagnostic[] {
  const rank = (file: string) => (file === entry ? 0 : 1);
  const sorted = [...diagnostics].sort(
    (a, b) =>
      rank(a.file) - rank(b.file) ||
      byText(a.file, b.file) ||
      a.line - b.line ||
      a.column - b.column ||
      byText(a.code, b.code),
  );
  return sorted.filter((diagnostic, index) => {
    const before = sorted[index - 1];
    return !before || formatDiagnostic(before) !== formatDiagnostic(diagnostic);
  });
}
