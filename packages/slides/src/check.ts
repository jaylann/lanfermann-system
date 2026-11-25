import { analyzeDeck, type AnalyzeInput } from "./analyze";
import {
  type BrowserChoice,
  BrowserUnavailableError,
  DeckNotReadyError,
  measureDeck,
} from "./browser";
import { htmlFor } from "./build";
import { bundleDeck } from "./bundle";
import { loadKit } from "./kit";
import { layoutDiagnostics } from "./layout";
import { typecheckDeck } from "./typecheck";
import { type Diagnostic, diagnosticOf, hasErrors, sortDiagnostics } from "./types";

export type CheckOptions = {
  /**
   * Whether the deck is also drawn and measured. `"auto"` (the default) does it when a browser
   * is there and says so in one warning when none is; `true` makes a missing browser an error;
   * `false` leaves the layout unchecked.
   */
  browser?: boolean | "auto";
  /** Which browser draws the deck. By default what `SLIDES_BROWSER` names, or Chrome. */
  launch?: BrowserChoice;
};

export type CheckResult = {
  /** No error. Warnings do not count. */
  ok: boolean;
  diagnostics: Diagnostic[];
  /** `window.__slidesReport` as the player wrote it, when the deck was drawn. */
  report?: unknown;
};

/** The compiler's ways to say that an import leads nowhere, which the static check says better. */
const UNRESOLVED: readonly string[] = ["ts2307", "ts2792"];
const IMPORT_CODES: readonly string[] = [
  "import-not-allowed",
  "import-outside-deck",
  "import-not-found",
  "unsupported-file",
];

/**
 * Everything the command line's `check` looks at: the static reading of the source
 * (`analyzeDeck`, with the kit's class names), the types (`typecheckDeck`), the bundle with the
 * notes left out (`bundleDeck`), and, with a browser, the layout as the player measures it in
 * check mode, from a file opened without a network.
 *
 * The layout is only looked at when everything before it holds: a deck that does not compile
 * cannot be drawn.
 */
export async function checkDeck(
  source: AnalyzeInput,
  options: CheckOptions = {},
): Promise<CheckResult> {
  const { entry } = source;
  const analysis = analyzeDeck(source, { classes: loadKit().classes });
  const diagnostics = [...analysis.diagnostics];
  const said = (codes: readonly string[], line: number, file: string) =>
    diagnostics.some(
      (diagnostic) =>
        codes.includes(diagnostic.code) && diagnostic.line === line && diagnostic.file === file,
    );

  let js: string | undefined;
  if (Object.hasOwn(source.files, entry)) {
    const found = await typecheckDeck(source);
    const syntax = found.some((error) => error.kind === "syntax");
    const types = found.map((error) => diagnosticOf(error, entry));
    diagnostics.push(
      ...types.filter(
        (type) => !UNRESOLVED.includes(type.code) || !said(IMPORT_CODES, type.line, type.file),
      ),
    );
    const bundle = await bundleDeck({ files: source.files, entry, stripNotes: true });
    js = bundle.js;
    for (const error of bundle.errors) {
      // Code that does not parse is said once, in the compiler's words.
      if (error.kind === "syntax" && syntax) continue;
      diagnostics.push(diagnosticOf(error, entry));
    }
  }

  let report: unknown;
  const browser = options.browser ?? "auto";
  if (browser !== false && js !== undefined && !hasErrors(diagnostics)) {
    try {
      report = await measureDeck(
        await htmlFor(js, source, analysis, { mode: "check" }),
        options.launch,
      );
      diagnostics.push(...layoutDiagnostics(report, analysis.slides, entry));
    } catch (error) {
      if (error instanceof DeckNotReadyError) {
        // A deck that never settles is a finding about the deck, not a failure of the tool.
        diagnostics.push({
          file: entry,
          line: 1,
          column: 1,
          code: "render-error",
          message: error.message,
          severity: "error",
        });
      } else if (error instanceof BrowserUnavailableError) {
        diagnostics.push({
          file: entry,
          line: 1,
          column: 1,
          code: "browser-not-found",
          message: `the layout was not checked: ${error.message}`,
          severity: browser === true ? "error" : "warning",
        });
      } else {
        throw error;
      }
    }
  }

  const sorted = sortDiagnostics(diagnostics, entry);
  return report === undefined
    ? { ok: !hasErrors(sorted), diagnostics: sorted }
    : { ok: !hasErrors(sorted), diagnostics: sorted, report };
}
