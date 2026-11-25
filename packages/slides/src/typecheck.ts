import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { KIT_MODULE } from "./deck-structure";
import { ALLOWED_MODULES } from "./imports";
import { KitError } from "./kit";
import { IMAGE_TYPES, isRelative, kindOf } from "./source";
import type { DeckError, DeckInput } from "./types";

const toPosix = (path: string) => path.replaceAll("\\", "/");

/** This module's own file: the place the kit's and React's types are looked for from. */
const HERE = toPosix(fileURLToPath(import.meta.url));
/**
 * Where the deck's files stand for the compiler. Nothing is written there: the folder exists in
 * the compiler host only, so a deck from memory is checked like one from a disk.
 */
const ROOT = toPosix(resolve(dirname(HERE), "__deck__"));
const ASSETS = `${ROOT}/__lf-slides-assets.d.ts`;

const OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  isolatedModules: true,
  allowImportingTsExtensions: true,
  forceConsistentCasingInFileNames: true,
  // Only what the deck imports: no @types package that happens to be installed beside the tool.
  types: [],
};

/** An import of a picture gives the text the picture is named by in the deck's script. */
const ASSET_TYPES = Object.keys(IMAGE_TYPES)
  .map(
    (extension) =>
      `declare module "*${extension}" {\n  const url: string;\n  export default url;\n}\n`,
  )
  .join("");

const inRoot = (path: string) => path === ROOT || path.startsWith(`${ROOT}/`);

/**
 * The declaration files of the compiler, of React and of the kit, parsed once per process: they
 * are the same for every deck, and reading them is most of a check's time.
 */
const shared = new Map<string, ts.SourceFile>();

function resolveModule(
  name: string,
  containingFile: string,
  options: ts.CompilerOptions,
  host: ts.ModuleResolutionHost,
): ts.ResolvedModuleFull | undefined {
  // A file of React or of the kit resolves as it would anywhere.
  if (!inRoot(containingFile)) {
    return ts.resolveModuleName(name, containingFile, options, host).resolvedModule;
  }
  if (ALLOWED_MODULES.includes(name)) {
    return ts.resolveModuleName(name, HERE, options, host).resolvedModule;
  }
  if (!isRelative(name)) return undefined;
  const resolved = ts.resolveModuleName(name, containingFile, options, host).resolvedModule;
  // A path that climbs out of the deck's folder must not find a file of the machine.
  return resolved && inRoot(toPosix(resolved.resolvedFileName)) ? resolved : undefined;
}

function check({ files, entry }: DeckInput): DeckError[] {
  const virtual = new Map<string, string>([[ASSETS, ASSET_TYPES]]);
  const folders = new Set<string>([ROOT]);
  for (const [path, text] of Object.entries(files)) {
    if (kindOf(path) !== "code") continue;
    virtual.set(`${ROOT}/${path}`, text);
    const parts = path.split("/").slice(0, -1);
    parts.forEach((_, index) => folders.add(`${ROOT}/${parts.slice(0, index + 1).join("/")}`));
  }

  const base = ts.createCompilerHost(OPTIONS, true);
  const host: ts.CompilerHost = {
    ...base,
    getCurrentDirectory: () => ROOT,
    fileExists: (file) => virtual.has(file) || (!inRoot(file) && base.fileExists(file)),
    readFile: (file) => virtual.get(file) ?? (inRoot(file) ? undefined : base.readFile(file)),
    directoryExists: (folder) =>
      folders.has(folder) || (!inRoot(folder) && (base.directoryExists?.(folder) ?? true)),
    getDirectories: (folder) => (inRoot(folder) ? [] : (base.getDirectories?.(folder) ?? [])),
    realpath: (path) => (inRoot(path) ? path : (base.realpath?.(path) ?? path)),
    writeFile: () => undefined,
    getSourceFile(file, languageVersion, onError, shouldCreate) {
      const text = virtual.get(file);
      if (text !== undefined) return ts.createSourceFile(file, text, languageVersion, true);
      if (inRoot(file)) return undefined;
      const known = shared.get(file);
      if (known) return known;
      const parsed = base.getSourceFile(file, languageVersion, onError, shouldCreate);
      if (parsed) shared.set(file, parsed);
      return parsed;
    },
    resolveModuleNameLiterals(literals, containingFile, _redirected, options) {
      return literals.map((literal) => ({
        resolvedModule: resolveModule(literal.text, toPosix(containingFile), options, host),
      }));
    },
  };

  if (!resolveModule(KIT_MODULE, `${ROOT}/${entry}`, OPTIONS, host)) {
    throw new KitError(
      `The types of ${KIT_MODULE} were not found beside this tool. In this repository, build ` +
        "the kit first (bun run --filter @lanfermann/ui build).",
    );
  }

  const program = ts.createProgram({ rootNames: [...virtual.keys()], options: OPTIONS, host });
  const keyOf = (diagnostic: ts.Diagnostic) =>
    `${diagnostic.file?.fileName}:${diagnostic.start}:${diagnostic.code}`;
  const syntactic = new Set(program.getSyntacticDiagnostics().map(keyOf));
  const errors: DeckError[] = [];
  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    const error: DeckError = {
      kind: syntactic.has(keyOf(diagnostic)) ? "syntax" : "type",
      code: `ts${diagnostic.code}`,
      message: ts
        .flattenDiagnosticMessageText(diagnostic.messageText, "\n")
        .split("\n")
        .map((line) => line.trim())
        .join(" "),
    };
    const file = diagnostic.file ? toPosix(diagnostic.file.fileName) : undefined;
    // An error without a place in the deck (a setting, a declaration file) has none here either.
    if (diagnostic.file && file !== undefined && inRoot(file) && file !== ASSETS) {
      error.file = file.slice(ROOT.length + 1);
      if (diagnostic.start !== undefined) {
        const place = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        error.line = place.line + 1;
        error.column = place.character + 1;
      }
    }
    errors.push(error);
  }
  return errors;
}

/**
 * Checks a deck's types against the kit's and React's declarations, as `tsc` would with
 * `strict` and `jsx: react-jsx`. The deck's files are served from memory; `react` and
 * `@lanfermann/ui/slides` resolve to the packages installed beside this tool, relative imports
 * to the deck's own files, and nothing else resolves at all.
 *
 * An error is of kind `type`, or `syntax` where the code does not parse; `code` is the
 * compiler's (`ts2322`). Separate from `bundleDeck`, which is fast and does not look at types.
 */
export function typecheckDeck(input: DeckInput): Promise<DeckError[]> {
  // The compiler works in one go. The promise is the contract's: a caller can await both this
  // and the bundle, and an error of the install (no kit) arrives as a rejection.
  return new Promise((done) => done(check(input)));
}
