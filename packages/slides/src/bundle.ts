import { build, type Message, type Plugin } from "esbuild";

import { parseDeck } from "./analyze";
import { KIT_MODULE } from "./deck-structure";
import { DYNAMIC_IMPORT, refusalOf, REQUIRE, scanImports } from "./imports";
import { kitVersion } from "./kit";
import { blankNotes, findLeaks, type NotesAttribute, scanNotes } from "./notes";
import { assetKey, kindOf, resolveImport } from "./source";
import { type BundleResult, type DeckError, type DeckInput, quote } from "./types";

export type BundleInput = DeckInput & {
  /**
   * Leave the presenter's notes out: for every file an audience gets. The result is not `ok`
   * when that cannot be done for certain, or when words of the notes stand in the script all
   * the same.
   */
  stripNotes?: boolean;
};

/** What the prebuilt player puts on `globalThis.__LF_SLIDES__`, by the module that means it. */
const PLAYER_GLOBALS: Readonly<Record<string, string>> = {
  react: "React",
  "react/jsx-runtime": "jsxRuntime",
  [KIT_MODULE]: "slides",
};

const DECK = "deck";
const PLAYER = "lf-player";
const IMAGE = "lf-image";

/**
 * Serves a deck's files to esbuild from memory and decides what an import may mean. This is
 * the lock on a deck's imports: whatever the static check says or is not asked, nothing but
 * React, the kit and the deck's own files gets into the script.
 */
function deckPlugin(files: Readonly<Record<string, string>>, entry: string): Plugin {
  const refuse = ({ code, message }: { code: string; message: string }) => ({
    errors: [{ text: message, detail: code }],
  });
  return {
    name: "lf-deck",
    setup(setup) {
      setup.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === "entry-point") return { path: entry, namespace: DECK };
        if (args.kind === "dynamic-import") return refuse(DYNAMIC_IMPORT);
        if (args.kind !== "import-statement") return refuse(REQUIRE);
        // Only a file of the deck imports anything here: the other modules are one line each.
        if (args.namespace !== DECK) {
          return refuse({
            code: "import-not-allowed",
            message: `import ${quote(args.path)} is not allowed`,
          });
        }
        const target = resolveImport(files, args.importer, args.path);
        const refusal = refusalOf(args.path, () => target);
        if (refusal) return refuse(refusal);
        const name = PLAYER_GLOBALS[args.path];
        if (name !== undefined) return { path: name, namespace: PLAYER };
        if (target.kind === "code") return { path: target.path, namespace: DECK };
        if (target.kind === "image") return { path: target.path, namespace: IMAGE };
        // `refusalOf` has an answer for every other target, so this is not reached.
        return refuse({
          code: "import-not-allowed",
          message: `import ${quote(args.path)} is not allowed`,
        });
      });
      setup.onLoad({ filter: /.*/, namespace: DECK }, (args) => ({
        contents: files[args.path] ?? "",
        loader: args.path.toLowerCase().endsWith(".tsx") ? "tsx" : "ts",
      }));
      // React and the slide parts are the player's: one React for the player and the deck.
      setup.onLoad({ filter: /.*/, namespace: PLAYER }, (args) => ({
        contents: `module.exports = globalThis.__LF_SLIDES__.${args.path};`,
        loader: "js",
      }));
      // A picture is named, not carried: `deckHtml` puts its data URL where the name stands.
      setup.onLoad({ filter: /.*/, namespace: IMAGE }, (args) => ({
        contents: `export default ${JSON.stringify(assetKey(args.path))};`,
        loader: "js",
      }));
    },
  };
}

function isBuildFailure(value: unknown): value is { errors: Message[] } {
  return (
    typeof value === "object" && value !== null && "errors" in value && Array.isArray(value.errors)
  );
}

function errorOf(message: Message): DeckError {
  const code: unknown = message.detail;
  const refused = typeof code === "string";
  const error: DeckError = {
    kind: refused || message.text.startsWith("No matching export") ? "import" : "syntax",
    code: refused ? code : "bundle",
    message: message.text,
  };
  const location = message.location;
  if (location) {
    // esbuild names a file of the plugin by its namespace and path.
    error.file = location.file.startsWith(`${DECK}:`)
      ? location.file.slice(DECK.length + 1)
      : location.file;
    error.line = location.line;
    error.column = location.column + 1;
  }
  return error;
}

/**
 * Compiles a deck to one script that sets `globalThis.__LF_DECK__` (the `<Deck>` is its
 * `default`), with React and the slide parts taken from the prebuilt player's
 * `globalThis.__LF_SLIDES__`. Fast: it does not look at types (`typecheckDeck` does).
 *
 * A deck imports `react`, `react/jsx-runtime`, `@lanfermann/ui/slides` and its own files by
 * relative path; anything else is an `import` error. Code that does not parse is a `syntax`
 * error. An import of a picture becomes the picture's name (`./bilder/werkbank.png`), which
 * `deckHtml` replaces by its data URL.
 *
 * With `stripNotes`, every `notes` attribute is taken out before the deck is compiled, and the
 * script is searched for the notes' words afterwards; see ./notes.ts for the rules. What breaks
 * them is a `notes` error. Errors are data, never thrown: `ok` is false and there is no `js`.
 * Only an install without the kit throws.
 */
export async function bundleDeck(input: BundleInput): Promise<BundleResult> {
  const version = kitVersion();
  const errors: DeckError[] = [];
  const failed = (): BundleResult => ({ ok: false, kitVersion: version, errors });

  if (!Object.hasOwn(input.files, input.entry) || kindOf(input.entry) !== "code") {
    errors.push({
      kind: "import",
      file: input.entry,
      line: 1,
      column: 1,
      code: "no-default-deck",
      message:
        `${input.entry} is missing: a deck is a folder with a ${input.entry} whose default ` +
        "export is a <Deck> element",
    });
    return failed();
  }

  // Every import the files write, used or not: the bundler below only meets the ones the
  // script loads, and locks those a second time.
  const parsed = parseDeck(input.files);
  errors.push(...scanImports(parsed, input.files));

  let files = input.files;
  let notes: NotesAttribute[] = [];
  if (input.stripNotes) {
    const scan = scanNotes(parsed);
    errors.push(...scan.errors);
    notes = scan.attributes;
    files = blankNotes(input.files, notes);
  }

  let js: string | undefined;
  try {
    const result = await build({
      entryPoints: [input.entry],
      bundle: true,
      write: false,
      format: "iife",
      globalName: "__LF_DECK__",
      platform: "browser",
      target: "es2022",
      jsx: "automatic",
      minify: true,
      // Text stays as it is written, so the notes' words can be looked for in the script.
      charset: "utf8",
      legalComments: "none",
      logLevel: "silent",
      // No tsconfig of the machine has a say in how a deck is compiled.
      tsconfigRaw: "{}",
      define: { "process.env.NODE_ENV": '"production"' },
      plugins: [deckPlugin(files, input.entry)],
    });
    js = result.outputFiles[0]?.text;
  } catch (failure) {
    if (!isBuildFailure(failure)) throw failure;
    // What the pass over the imports has said already is not said again.
    const said = new Set(errors.map(keyOf));
    errors.push(...failure.errors.map(errorOf).filter((error) => !said.has(keyOf(error))));
  }

  if (js !== undefined && input.stripNotes) errors.push(...findLeaks(js, notes));
  return js !== undefined && errors.length === 0
    ? { ok: true, js, kitVersion: version, errors }
    : failed();
}

function keyOf(error: DeckError): string {
  return [error.code, error.file, error.line, error.column].join("\n");
}
