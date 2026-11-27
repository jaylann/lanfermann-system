import ts from "typescript";

import { KIT_MODULE } from "./deck-structure";
import { placeOf } from "./notes";
import { type ImportTarget, isRelative, resolveImport } from "./source";
import { type DeckError, quote } from "./types";

/**
 * What a deck may import, and how each refusal is worded. Two readers ask here, so they say
 * the same thing at the same place: the pass over a deck's import statements below, and the
 * bundler's plugin, which sees only what the script really loads.
 */

/** What a deck may import besides its own files. */
export const ALLOWED_MODULES: readonly string[] = ["react", "react/jsx-runtime", KIT_MODULE];

export const DYNAMIC_IMPORT = {
  code: "dynamic-import",
  message: "import() is not allowed in a deck: a deck is one script, loaded at once",
};
export const REQUIRE = {
  code: "require",
  message: "require is not allowed in a deck: use import",
};

/** One `/// <reference … />` at the head of a file: where its comment stands, and what it names. */
export type ReferenceDirective = {
  /** The comment's first character in the file's text, and the one after its last. */
  start: number;
  end: number;
  /** `path`, `types`, `lib` or `no-default-lib`, when the directive names one of them. */
  attribute?: string;
};

const REFERENCE_ATTRIBUTES: readonly string[] = ["path", "types", "lib", "no-default-lib"];

/**
 * The triple-slash reference directives of a file: every `///` comment before its first line of
 * code that opens a `<reference`, which is where the compiler reads them and nowhere else. Read
 * a little wider than the compiler does (it also wants the closing `/>`), so that nothing it
 * takes for a directive is missed here.
 */
export function referenceDirectives(text: string): ReferenceDirective[] {
  const found: ReferenceDirective[] = [];
  for (const range of ts.getLeadingCommentRanges(text, 0) ?? []) {
    if (range.kind !== ts.SyntaxKind.SingleLineCommentTrivia) continue;
    const comment = text.slice(range.pos, range.end);
    if (!/^\/\/\/\s*<reference/i.test(comment)) continue;
    const named = /\s([a-z-]+)\s*=/i.exec(comment)?.[1]?.toLowerCase();
    found.push({
      start: range.pos,
      end: range.end,
      ...(named !== undefined && REFERENCE_ATTRIBUTES.includes(named) ? { attribute: named } : {}),
    });
  }
  return found;
}

/**
 * Why a reference directive is refused. It would make the compiler read a file, a package's
 * types or a library by a name the deck picks, past everything that checks an import. The
 * message names the kind of directive and not what it points at.
 */
function referenceRefusal(directive: ReferenceDirective): { code: string; message: string } {
  const written =
    directive.attribute === undefined ? "<reference>" : `<reference ${directive.attribute}>`;
  return {
    code: "reference-not-allowed",
    message:
      `/// ${written} is not allowed in a deck: a deck takes in its own files, React and ` +
      "the kit by import, and nothing else",
  };
}

/** The refusals for a file's reference directives, each at the comment that writes one. */
export function scanReferences(path: string, text: string): DeckError[] {
  return referenceDirectives(text).map((directive) => {
    // Counted as the compiler counts lines, without parsing the file for it.
    const before = text.slice(0, directive.start).split(/\r\n|[\n\r\u2028\u2029]/);
    return {
      kind: "import",
      file: path,
      line: before.length,
      column: (before.at(-1)?.length ?? 0) + 1,
      ...referenceRefusal(directive),
    };
  });
}

/** Why an import by name is refused, or `undefined` for one a deck may write. */
export function refusalOf(
  name: string,
  target: () => ImportTarget,
): { code: string; message: string } | undefined {
  if (ALLOWED_MODULES.includes(name)) return undefined;
  if (!isRelative(name)) {
    return { code: "import-not-allowed", message: `import ${quote(name)} is not allowed` };
  }
  switch (target().kind) {
    case "outside":
      return {
        code: "import-outside-deck",
        message: `import ${quote(name)} leaves the deck's folder`,
      };
    case "missing":
      return {
        code: "import-not-found",
        message: `import ${quote(name)} names no file of the deck`,
      };
    case "unsupported":
      return {
        code: "unsupported-file",
        message: `import ${quote(name)} is not a file a deck can import: it takes .ts, .tsx and pictures`,
      };
    default:
      return undefined;
  }
}

/**
 * Every import a deck's files write, whether the script ends up using it or not: a bundler
 * drops an import nothing uses before it asks anyone, and an import that only a type uses is
 * gone before the deck runs. Both are still not what a deck may write.
 *
 * With `images` (the command line has them), an import of a picture that is not there is
 * reported as well.
 *
 * A `/// <reference … />` is refused here too: it takes a file in as an import does, by a name
 * of the deck's choosing. `typecheckDeck` says the same about it, in the same words.
 */
export function scanImports(
  parsed: ReadonlyMap<string, ts.SourceFile>,
  files: Readonly<Record<string, unknown>>,
  images?: Readonly<Record<string, unknown>>,
): DeckError[] {
  const errors: DeckError[] = [];
  for (const [path, file] of parsed) {
    errors.push(...scanReferences(path, file.text));
    const refuse = (node: ts.Node, { code, message }: { code: string; message: string }) => {
      errors.push({
        kind: "import",
        file: path,
        ...placeOf(file, node.getStart(file)),
        code,
        message,
      });
    };
    const specifier = (literal: ts.StringLiteralLike) => {
      const name = literal.text;
      let target: ImportTarget | undefined;
      const resolve = () => (target ??= resolveImport(files, path, name));
      const refusal = refusalOf(name, resolve);
      if (refusal) {
        refuse(literal, refusal);
      } else if (isRelative(name) && images) {
        const found = resolve();
        if (found.kind === "image" && !Object.hasOwn(images, found.path)) {
          refuse(literal, {
            code: "import-not-found",
            message: `import ${quote(name)} names no file of the deck`,
          });
        }
      }
    };
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
          specifier(node.moduleSpecifier);
        }
      } else if (ts.isImportEqualsDeclaration(node)) {
        if (ts.isExternalModuleReference(node.moduleReference)) refuse(node, REQUIRE);
      } else if (ts.isImportTypeNode(node)) {
        const argument = node.argument;
        if (ts.isLiteralTypeNode(argument) && ts.isStringLiteralLike(argument.literal)) {
          specifier(argument.literal);
        }
      } else if (ts.isCallExpression(node)) {
        // At the name where there is one: that is also where the bundler points.
        const name = node.arguments[0];
        const at = name && ts.isStringLiteralLike(name) ? name : node;
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) refuse(at, DYNAMIC_IMPORT);
        else if (ts.isIdentifier(node.expression) && node.expression.text === "require") {
          refuse(at, REQUIRE);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return errors;
}
