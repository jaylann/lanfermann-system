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
 */
export function scanImports(
  parsed: ReadonlyMap<string, ts.SourceFile>,
  files: Readonly<Record<string, unknown>>,
  images?: Readonly<Record<string, unknown>>,
): DeckError[] {
  const errors: DeckError[] = [];
  for (const [path, file] of parsed) {
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
