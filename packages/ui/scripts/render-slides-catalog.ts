/**
 * The catalog of the slide parts, read from their source: what each part is for (its doc
 * comment), what it takes (its props type, with each prop's doc comment) and one example (the
 * `<Name>Example` beside it). The author of a deck, a person or a model, reads the catalog and
 * not the code, so it is generated and a test fails when the two drift
 * (`bun run gen:slides-catalog`).
 *
 * Pure: it gets a `read` function and returns the entries and the file's text.
 */
import ts from "typescript";

export type CatalogProp = { name: string; type: string; required: boolean; description: string };
export type CatalogEntry = {
  name: string;
  group: string;
  summary: string;
  notes: string;
  props: CatalogProp[];
  example?: string;
};

type Read = (path: string) => string | undefined;

function parse(path: string, text: string) {
  return ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

const oneLine = (text: string) => text.replaceAll(/\s+/g, " ").trim();

/** The doc comment of a declaration as paragraphs, each on one line. */
function paragraphs(node: ts.Node): string[] {
  const [doc] = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);
  const text = doc ? (ts.getTextOfJSDocComment(doc.comment) ?? "") : "";
  return text
    .split(/\n\s*\n/)
    .map(oneLine)
    .filter(Boolean);
}

function isExported(node: ts.Node) {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

/** Which module of the entry exports each value: `Title` comes from `title/title`. */
function modulesOf(index: ts.SourceFile): Map<string, string> {
  const modules = new Map<string, string>();
  for (const statement of index.statements) {
    if (
      !ts.isExportDeclaration(statement) ||
      statement.isTypeOnly ||
      !statement.moduleSpecifier ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.exportClause ||
      !ts.isNamedExports(statement.exportClause)
    )
      continue;
    const module = statement.moduleSpecifier.text.replace(/^\.\//, "");
    for (const element of statement.exportClause.elements) {
      if (!element.isTypeOnly) modules.set(element.name.text, module);
    }
  }
  return modules;
}

/** The members a props type declares itself: the type literals of the alias, through `&`. */
function ownMembers(type: ts.TypeNode): ts.PropertySignature[] {
  if (ts.isTypeLiteralNode(type)) return type.members.filter(ts.isPropertySignature);
  if (ts.isIntersectionTypeNode(type)) return type.types.flatMap(ownMembers);
  if (ts.isParenthesizedTypeNode(type)) return ownMembers(type.type);
  return [];
}

/** Named types a reader of the catalog cannot look up, written as what they stand for. */
const SPELLED_OUT: Record<string, string> = {
  SlideGround: '"paper" | "tint" | "ink" | "indigo"',
};

function spelledOut(type: string) {
  return type.replaceAll(/\b[A-Z][A-Za-z]+\b/g, (name) => SPELLED_OUT[name] ?? name);
}

function propsOf(source: ts.SourceFile, name: string): CatalogProp[] {
  const alias = source.statements.find(
    (statement): statement is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(statement) && statement.name.text === `${name}Props`,
  );
  if (!alias) return [];
  return ownMembers(alias.type).map((member) => ({
    name: member.name.getText(source),
    type: member.type ? spelledOut(oneLine(member.type.getText(source))) : "unknown",
    required: !member.questionToken,
    description: paragraphs(member).join(" "),
  }));
}

/** The text with the indentation its lines share (but for the first) taken off. */
function dedent(text: string) {
  const [first = "", ...rest] = text.split("\n");
  const depth = Math.min(
    ...rest.filter((line) => line.trim()).map((line) => /^ */.exec(line)![0].length),
  );
  return [first, ...rest.map((line) => line.slice(Number.isFinite(depth) ? depth : 0))].join("\n");
}

/**
 * The JSX that `<Name>Example` returns, under one import line from the package: what the author
 * of a deck would write.
 */
function exampleOf(source: ts.SourceFile, name: string): string | undefined {
  const example = source.statements.find(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) && statement.name?.text === `${name}Example`,
  );
  const returned = example?.body?.statements.find(ts.isReturnStatement)?.expression;
  if (!returned) return undefined;
  const jsx = ts.isParenthesizedExpression(returned) ? returned.expression : returned;

  const names = new Set<string>();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith("@/slides/") ||
      statement.importClause?.phaseModifier === ts.SyntaxKind.TypeKeyword
    )
      continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      if (!element.isTypeOnly) names.add(element.name.text);
    }
  }
  const imports = `import { ${[...names].sort().join(", ")} } from "@lanfermann/ui/slides";`;
  return `${imports}\n\n${dedent(withoutFooterProps(jsx, source))}`;
}

/**
 * The JSX without `deck` and `page`. An example stands alone, so it names its deck and its page
 * for the footer row; in a `Deck` both are filled in, and the author should not write them.
 */
function withoutFooterProps(jsx: ts.Expression, source: ts.SourceFile): string {
  const cuts: [number, number][] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxAttribute(node) && ["deck", "page"].includes(node.name.getText(source))) {
      cuts.push([node.getFullStart(), node.getEnd()]);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(jsx);
  let text = source.text.slice(jsx.getStart(source), jsx.getEnd());
  const offset = jsx.getStart(source);
  for (const [start, end] of cuts.sort((a, b) => b[0] - a[0])) {
    text = text.slice(0, start - offset) + text.slice(end - offset);
  }
  return text;
}

/**
 * Reads the catalog. `groups` names every part once, in the order the catalog lists them; `read`
 * returns a file of `src/slides` by its path below that folder, or `undefined`.
 */
export function readSlidesCatalog(
  groups: Record<string, readonly string[]>,
  read: Read,
): CatalogEntry[] {
  const indexText = read("index.ts");
  if (indexText === undefined) throw new Error("src/slides/index.ts not found");
  const modules = modulesOf(parse("index.ts", indexText));

  const entries: CatalogEntry[] = [];
  for (const [group, names] of Object.entries(groups)) {
    for (const name of names) {
      const module = modules.get(name);
      if (!module) throw new Error(`${name} is in group "${group}" but not exported by index.ts`);
      const text = read(`${module}.tsx`);
      if (text === undefined) throw new Error(`${module}.tsx not found (for ${name})`);
      const source = parse(`${module}.tsx`, text);
      const declaration = source.statements.find(
        (statement): statement is ts.FunctionDeclaration =>
          ts.isFunctionDeclaration(statement) &&
          statement.name?.text === name &&
          isExported(statement),
      );
      if (!declaration) throw new Error(`${module}.tsx exports no function ${name}`);
      const [summary = "", ...notes] = paragraphs(declaration);

      const exampleText = read(`${module}.example.tsx`);
      const example = exampleText
        ? exampleOf(parse(`${module}.example.tsx`, exampleText), name)
        : undefined;

      entries.push({
        name,
        group,
        summary,
        notes: notes.join("\n\n"),
        props: propsOf(source, name),
        ...(example ? { example } : {}),
      });
    }
  }
  return entries;
}

/** Every part the entry exports: a capitalised name that is not a constant in capitals. */
export function exportedParts(read: Read): string[] {
  const indexText = read("index.ts");
  if (indexText === undefined) throw new Error("src/slides/index.ts not found");
  return [...modulesOf(parse("index.ts", indexText)).keys()].filter(
    (name) => /^[A-Z]/.test(name) && /[a-z]/.test(name),
  );
}

/** The generated module. */
export function renderSlidesCatalog(entries: CatalogEntry[]): string {
  return [
    "// Generated by `bun run gen:slides-catalog` from the slide parts' doc comments, props types",
    "// and examples. Do not edit: change the part and run the script.",
    'import type { SlideCatalogEntry } from "./entry";',
    "",
    `export const slidesCatalog: SlideCatalogEntry[] = ${JSON.stringify(entries, null, 2)};`,
    "",
  ].join("\n");
}
