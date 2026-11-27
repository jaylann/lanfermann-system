import { existsSync } from "node:fs";
import { dirname, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { KIT_MODULE } from "./deck-structure";
import { ALLOWED_MODULES, referenceDirectives, scanReferences } from "./imports";
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
 * A folder of the machine the compiler may read from, besides the deck: where it is reached
 * (through a link in a `node_modules` folder, and by its real path, which the compiler follows
 * links to), the name a message calls it by, and which paths inside it count.
 */
type Grant = {
  prefixes: readonly string[];
  name: string;
  /** Whether a path inside the folder may be read; `""` is the folder itself. */
  allows: (inside: string) => boolean;
};

type Allowlist = {
  grants: readonly Grant[];
  /**
   * The `node_modules` folders and scope folders a granted package hangs in. The resolver asks
   * whether they are there before it looks into them; nothing in them but the package answers.
   */
  links: ReadonlySet<string>;
};

/** A path as the two sides of a comparison write it: a disk that ignores case folds it. */
const fold = (path: string) => (ts.sys.useCaseSensitiveFileNames ? path : path.toLowerCase());
const realOf = (path: string) => toPosix(ts.sys.realpath?.(path) ?? path);

/**
 * The folder of a package as the compiler's resolution finds it from `from`: the nearest
 * `node_modules/<name>` on the way up. A folder that is itself named `node_modules` is passed
 * over, as the compiler passes it over.
 */
function packageFolder(from: string, name: string): string | undefined {
  for (let folder = from; ; folder = posix.dirname(folder)) {
    if (posix.basename(folder) !== "node_modules") {
      const candidate = `${folder}/node_modules/${name}`;
      if (existsSync(`${candidate}/package.json`)) return candidate;
    }
    // The top of the disk, or of a drive: beyond it a path would count from where the tool runs.
    const above = posix.dirname(folder);
    if (above === folder || above === ".") return undefined;
  }
}

/** Anything in a package but what other packages put into it. */
const ownFiles = (inside: string) => !inside.split("/").includes("node_modules");

let allowlist: Allowlist | undefined;

/**
 * What the compiler may read besides the deck, found once per process from where this tool is
 * installed: the compiler's own `lib.*.d.ts`, the packages `@types/react` and `csstype` (which
 * React's types import), and of the kit its `package.json` and its `dist`. In this repository
 * the kit is a link to a folder that also holds its source, its tests and its own
 * `node_modules`; none of that is granted.
 */
function allowed(): Allowlist {
  if (allowlist) return allowlist;
  const grants: Grant[] = [];
  const links = new Set<string>();
  const grant = (name: string, folder: string, allows: Grant["allows"]): string => {
    const real = realOf(folder);
    grants.push({ name, prefixes: [...new Set([folder, real])].map(fold), allows });
    return real;
  };
  const installed = (from: string, name: string, allows: Grant["allows"]) => {
    const folder = packageFolder(from, name);
    if (folder === undefined) return undefined;
    const outer = folder.slice(0, folder.length - name.length - 1);
    links.add(fold(outer));
    if (name.startsWith("@")) links.add(fold(posix.dirname(folder)));
    return grant(name, folder, allows);
  };

  const lib = toPosix(dirname(ts.getDefaultLibFilePath(OPTIONS)));
  grant("typescript/lib", lib, (inside) => inside === "" || /^lib\.[\w.-]+\.d\.ts$/.test(inside));
  const here = toPosix(dirname(HERE));
  const react = installed(here, "@types/react", ownFiles);
  // Where React's types find it: beside them, or nested in them.
  if (react !== undefined) installed(react, "csstype", ownFiles);
  installed(
    here,
    "@lanfermann/ui",
    (inside) => inside === "" || inside === "package.json" || /^dist(?:\/|$)/.test(inside),
  );

  allowlist = { grants, links };
  return allowlist;
}

/** The grant a path falls under, with the path's part inside it: by text alone, no disk. */
function grantOf(path: string): { grant: Grant; inside: string } | undefined {
  const folded = fold(path);
  let best: { grant: Grant; prefix: string } | undefined;
  for (const candidate of allowed().grants) {
    for (const prefix of candidate.prefixes) {
      if (folded !== prefix && !folded.startsWith(`${prefix}/`)) continue;
      // The longest wins: a package nested in another is a grant of its own.
      if (!best || prefix.length > best.prefix.length) best = { grant: candidate, prefix };
    }
  }
  return best && { grant: best.grant, inside: path.slice(best.prefix.length + 1) };
}

const granted = (path: string) => {
  const found = grantOf(path);
  return found !== undefined && found.grant.allows(found.inside);
};

/**
 * Whether the compiler may ask the disk for a path outside the deck. Only for the compiler's
 * library files, React's types with `csstype`, and the kit's declarations; for anything else the
 * answer is no without the disk being touched. A path that passes by its text is then followed
 * to where it really is, so a link inside a granted folder cannot lead out of all of them.
 */
export function mayRead(path: string): boolean {
  const asked = posix.normalize(toPosix(path));
  return granted(asked) && granted(realOf(asked));
}

/** A path the host answers from the disk: the deck's own folder is in memory, all of it. */
const onDisk = (path: string) => !inRoot(path) && mayRead(path);

/**
 * The declaration files of the compiler, of React and of the kit, parsed once per process: they
 * are the same for every deck, and reading them is most of a check's time. Only a file that
 * `mayRead` grants is ever put here.
 */
const shared = new Map<string, ts.SourceFile>();

const isReact = (name: string) => name === "react" || name.startsWith("react/");

function resolveModule(
  name: string,
  containingFile: string,
  options: ts.CompilerOptions,
  host: ts.ModuleResolutionHost,
): ts.ResolvedModuleFull | undefined {
  // React and the kit are the ones beside this tool, whoever asks: the deck, or the kit's own
  // declarations, which would otherwise look for React from where the kit is installed.
  if (ALLOWED_MODULES.includes(name) || (isReact(name) && !inRoot(containingFile))) {
    return ts.resolveModuleName(name, HERE, options, host).resolvedModule;
  }
  // A file of React or of the kit resolves as it would anywhere, on a disk that holds only
  // what `mayRead` grants: its own package's files, and `csstype` for React's types.
  if (!inRoot(containingFile)) {
    return ts.resolveModuleName(name, containingFile, options, host).resolvedModule;
  }
  if (!isRelative(name)) return undefined;
  const resolved = ts.resolveModuleName(name, containingFile, options, host).resolvedModule;
  // A path that climbs out of the deck's folder must not find a file of the machine.
  return resolved && inRoot(toPosix(resolved.resolvedFileName)) ? resolved : undefined;
}

/** The deck's text with each reference directive blanked: the same length, the same lines. */
function withoutReferences(text: string): string {
  let blanked = text;
  for (const { start, end } of referenceDirectives(text)) {
    blanked = blanked.slice(0, start) + " ".repeat(end - start) + blanked.slice(end);
  }
  return blanked;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A compiler's message without a path of the machine. The compiler names files by their whole
 * path (`import("/…/__deck__/parts/zahl").Zahl`, `File '/…' not found`): a file of the deck is
 * named by its path inside the deck, a granted folder by its package, and whatever else stands
 * where the compiler writes a file's name is not named at all. Exported for its test.
 */
export function scrub(message: string): string {
  let text = message;
  for (const [prefix, name] of machinePaths()) {
    text = text.replace(prefix, (_, slash: string) => (name === "" ? "" : `${name}${slash}`));
  }
  // What is left is no file of the deck and none of a granted folder. A whole path has more
  // than one step; `'/'` alone is an operator the compiler names.
  return text
    .replace(OTHER_FILE, "'a file outside the deck'")
    .replace(OTHER_IMPORT, 'import("a file outside the deck")');
}

const PATH = String.raw`(?:[A-Za-z]:)?[\\/][^'"\s\\/]+[\\/][^'"\s]*`;
const OTHER_FILE = new RegExp(`'${PATH}'`, "g");
const OTHER_IMPORT = new RegExp(String.raw`import\("${PATH}"\)`, "g");

let knownPaths: [RegExp, string][] | undefined;

/**
 * The paths a message may hold, each with the name that takes its place: the deck's folder in
 * memory (nothing: what follows is the path in the deck) and every granted folder (its
 * package). The longest first, so that a folder inside another is named for itself.
 */
function machinePaths(): [RegExp, string][] {
  if (knownPaths) return knownPaths;
  const names: [string, string][] = [[ROOT, ""]];
  for (const { prefixes, name } of allowed().grants) {
    for (const prefix of prefixes) names.push([prefix, name]);
  }
  const flags = ts.sys.useCaseSensitiveFileNames ? "g" : "gi";
  knownPaths = names
    .sort(([a], [b]) => b.length - a.length)
    .map(([prefix, name]) => [new RegExp(`${escapeRegExp(prefix)}(/?)`, flags), name]);
  return knownPaths;
}

function check({ files, entry }: DeckInput): DeckError[] {
  const virtual = new Map<string, string>([[ASSETS, ASSET_TYPES]]);
  const folders = new Set<string>([ROOT]);
  // What a deck's reference directives would take in is never looked for: each is refused, and
  // the compiler reads the file without them.
  const errors: DeckError[] = [];
  for (const [path, text] of Object.entries(files)) {
    if (kindOf(path) !== "code") continue;
    errors.push(...scanReferences(path, text));
    virtual.set(`${ROOT}/${path}`, withoutReferences(text));
    const parts = path.split("/").slice(0, -1);
    parts.forEach((_, index) => folders.add(`${ROOT}/${parts.slice(0, index + 1).join("/")}`));
  }

  const base = ts.createCompilerHost(OPTIONS, true);
  // Every answer about the disk goes through `mayRead`; what `base` would do on its own with a
  // path (list a folder, write, read the environment) is switched off.
  const host: ts.CompilerHost = {
    ...base,
    getCurrentDirectory: () => ROOT,
    fileExists: (file) => virtual.has(file) || (onDisk(file) && base.fileExists(file)),
    readFile: (file) => virtual.get(file) ?? (onDisk(file) ? base.readFile(file) : undefined),
    directoryExists: (folder) =>
      folders.has(folder) ||
      allowed().links.has(fold(folder)) ||
      (onDisk(folder) && (base.directoryExists?.(folder) ?? true)),
    getDirectories: () => [],
    readDirectory: () => [],
    realpath: (path) => (onDisk(path) ? (base.realpath?.(path) ?? path) : path),
    getEnvironmentVariable: () => "",
    writeFile: () => undefined,
    getSourceFile(file, languageVersion, onError, shouldCreate) {
      const text = virtual.get(file);
      if (text !== undefined) return ts.createSourceFile(file, text, languageVersion, true);
      if (!onDisk(file)) return undefined;
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
    resolveTypeReferenceDirectiveReferences(references, containingFile, _redirected, options) {
      return references.map((reference) => {
        // Nothing in the deck asks for a package's types by name. React's and the kit's
        // declarations may, and find only what `mayRead` grants.
        if (inRoot(toPosix(containingFile))) return { resolvedTypeReferenceDirective: undefined };
        const name = typeof reference === "string" ? reference : reference.fileName;
        return ts.resolveTypeReferenceDirective(name, containingFile, options, host);
      });
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
  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    const error: DeckError = {
      kind: syntactic.has(keyOf(diagnostic)) ? "syntax" : "type",
      code: `ts${diagnostic.code}`,
      message: scrub(
        ts
          .flattenDiagnosticMessageText(diagnostic.messageText, "\n")
          .split("\n")
          .map((line) => line.trim())
          .join(" "),
      ),
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
 * The compiler reads nothing of the machine but its own library files, React's types and the
 * kit's declarations (`mayRead`). A `/// <reference … />` in a deck is not followed: it is an
 * error of kind `import` with the code `reference-not-allowed`. No message names a path of the
 * machine.
 *
 * Any other error is of kind `type`, or `syntax` where the code does not parse; `code` is the
 * compiler's (`ts2322`). Separate from `bundleDeck`, which is fast and does not look at types.
 */
export function typecheckDeck(input: DeckInput): Promise<DeckError[]> {
  // The compiler works in one go. The promise is the contract's: a caller can await both this
  // and the bundle, and an error of the install (no kit) arrives as a rejection.
  return new Promise((done) => done(check(input)));
}
