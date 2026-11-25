import ts from "typescript";

import { readStructure, type SlideInfo } from "./deck-structure";
import { scanImports } from "./imports";
import { literalText } from "./jsx-text";
import { placeOf, scanNotes } from "./notes";
import { isDeckPath, kindOf, MAX_DECK_IMAGE_BYTES, MAX_IMAGE_BYTES } from "./source";
import {
  type DeckInput,
  type Diagnostic,
  diagnosticOf,
  quote,
  type Severity,
  sortDiagnostics,
} from "./types";

export type { SlideInfo } from "./deck-structure";

/** What a deck's source says about it, read without running it. */
export type DeckAnalysis = {
  /** The deck's title as plain text, if it is written out. */
  title?: string;
  /** The deck's language, if it names one. A deck without is German. */
  lang?: string;
  slides: SlideInfo[];
  diagnostics: Diagnostic[];
};

/** A deck's code, and its pictures if they are at hand (the command line has them). */
export type AnalyzeInput = DeckInput & { images?: Readonly<Record<string, Uint8Array>> };

export type AnalyzeOptions = {
  /**
   * The class names the kit's stylesheet defines (`classes.json` of the prebuilt player). With
   * them, a `className` in the deck is checked; without, classes are not looked at.
   */
  classes?: readonly string[];
};

/** Names a deck may not use: they reach the network or run text as code. */
const FORBIDDEN_GLOBALS: readonly string[] = ["fetch", "XMLHttpRequest", "WebSocket", "eval"];
const GLOBAL_OBJECTS: readonly string[] = ["window", "globalThis", "self"];

const megabytes = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;

/** The code files of a deck, parsed. A file that is no code is left out. */
export function parseDeck(files: Readonly<Record<string, string>>): Map<string, ts.SourceFile> {
  const parsed = new Map<string, ts.SourceFile>();
  for (const [path, text] of Object.entries(files)) {
    if (kindOf(path) !== "code") continue;
    parsed.set(
      path,
      ts.createSourceFile(
        path,
        text,
        ts.ScriptTarget.ES2022,
        true,
        path.toLowerCase().endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      ),
    );
  }
  return parsed;
}

/** Whether a name stands where a value is read, and not where a property is only named. */
function isValueReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return ts.isIdentifier(parent.expression) && GLOBAL_OBJECTS.includes(parent.expression.text);
  }
  if (ts.isBindingElement(parent)) return parent.propertyName !== node;
  if (ts.isJsxAttribute(parent) || ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) {
    return false;
  }
  if (
    (ts.isPropertyAssignment(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isMethodSignature(parent) ||
      ts.isGetAccessorDeclaration(parent) ||
      ts.isSetAccessorDeclaration(parent) ||
      ts.isEnumMember(parent)) &&
    parent.name === node
  ) {
    return false;
  }
  // `let socket: WebSocket` names a type, which is gone when the deck runs.
  for (let above: ts.Node | undefined = parent; above; above = above.parent) {
    if (ts.isTypeNode(above)) return false;
    if (ts.isStatement(above)) break;
  }
  return true;
}

/** Whether a name (or `window.<name>`) is what a call or a `new` runs. */
function isCalled(node: ts.Identifier): boolean {
  const target =
    ts.isPropertyAccessExpression(node.parent) && node.parent.name === node ? node.parent : node;
  const call = target.parent;
  return (ts.isCallExpression(call) || ts.isNewExpression(call)) && call.expression === target;
}

function literalNode(
  expression: ts.Expression,
): ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | undefined {
  let inner = expression;
  while (ts.isParenthesizedExpression(inner)) inner = inner.expression;
  return ts.isStringLiteral(inner) || ts.isNoSubstitutionTemplateLiteral(inner) ? inner : undefined;
}

/**
 * Reads a deck's source without running it and without touching a disk: what it imports, which
 * names it uses, whether its default export is a `<Deck>`, its slides and their notes, its
 * classes and the weight of its pictures. Types are `typecheckDeck`'s and layout is
 * `checkDeck`'s; a file that does not parse is reported by the bundler.
 */
export function analyzeDeck(source: AnalyzeInput, options: AnalyzeOptions = {}): DeckAnalysis {
  const diagnostics: Diagnostic[] = [];
  const classes = options.classes ? new Set(options.classes) : undefined;
  const add = (
    file: string,
    place: { line: number; column: number },
    code: string,
    message: string,
    severity: Severity = "error",
  ) => {
    const { line, column } = place;
    diagnostics.push({ file, line, column, code, message, severity });
  };
  const top = { line: 1, column: 1 };
  const unsupported = (path: string) =>
    add(
      path,
      top,
      "unsupported-file",
      `${quote(path)} is not a file a deck can hold: it takes .ts, .tsx and pictures ` +
        "(.png, .jpg, .jpeg, .webp, .svg, .avif)",
    );

  // The files themselves.
  for (const path of Object.keys(source.files)) {
    if (!isDeckPath(path) || kindOf(path) !== "code") unsupported(path);
  }
  let weight = 0;
  for (const [path, bytes] of Object.entries(source.images ?? {})) {
    if (!isDeckPath(path) || kindOf(path) !== "image") {
      unsupported(path);
      continue;
    }
    weight += bytes.byteLength;
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      add(
        path,
        top,
        "asset-too-large",
        `${quote(path)} weighs ${megabytes(bytes.byteLength)}: a picture may weigh ` +
          `${megabytes(MAX_IMAGE_BYTES)}, because it becomes part of the one file`,
      );
    }
  }
  if (weight > MAX_DECK_IMAGE_BYTES) {
    add(
      source.entry,
      top,
      "asset-too-large",
      `the deck's pictures weigh ${megabytes(weight)} together: ` +
        `${megabytes(MAX_DECK_IMAGE_BYTES)} is the most a deck may carry`,
    );
  }

  const parsed = parseDeck(source.files);
  const entry = parsed.get(source.entry);
  const analysis: DeckAnalysis = { slides: [], diagnostics };
  let slideNotes: Set<number> | undefined;
  if (!entry) {
    add(
      source.entry,
      top,
      "no-default-deck",
      `${source.entry} is missing: a deck is a folder with a ${source.entry} whose default ` +
        "export is a <Deck> element",
    );
  } else {
    const structure = readStructure(entry, source.entry);
    if (structure.title !== undefined) analysis.title = structure.title;
    if (structure.lang !== undefined) analysis.lang = structure.lang;
    analysis.slides = structure.slides;
    diagnostics.push(...structure.diagnostics);
    // Without a deck there are no slides to tell notes from.
    if (structure.diagnostics.every((diagnostic) => diagnostic.code !== "no-default-deck")) {
      slideNotes = structure.slideNotes;
    }
  }

  // The notes: what a build for an audience could not leave out for certain is an error
  // already here, so a deck that passes the check gets both builds.
  const notes = scanNotes(parsed);
  for (const error of notes.errors) diagnostics.push(diagnosticOf(error, source.entry));
  if (slideNotes) {
    for (const note of notes.attributes) {
      if (note.file === source.entry && slideNotes.has(note.start)) continue;
      if (!note.texts?.some((text) => text.trim() !== "")) continue;
      add(
        note.file,
        note,
        "notes-ignored",
        "notes are read from the children of <Deck> only: these are never shown " +
          "(a build for an audience leaves them out all the same)",
        "warning",
      );
    }
  }

  // The imports: every one a file writes, used or not.
  for (const error of scanImports(parsed, source.files, source.images)) {
    diagnostics.push(diagnosticOf(error, source.entry));
  }

  for (const [path, file] of parsed) {
    const at = (node: ts.Node) => placeOf(file, node.getStart(file));

    const className = (attribute: ts.JsxAttribute) => {
      const value = attribute.initializer;
      if (!classes || value === undefined) return;
      if (ts.isJsxExpression(value) && !value.expression) return;
      const literal = ts.isStringLiteral(value)
        ? value
        : ts.isJsxExpression(value) && value.expression
          ? literalNode(value.expression)
          : undefined;
      if (!literal) {
        add(
          path,
          at(attribute),
          "class-not-checked",
          "className is not a plain string: its classes are not checked against the kit's",
          "warning",
        );
        return;
      }
      // The text between the quotes, as written: a class name holds nothing that is escaped.
      const start = literal.getStart(file) + 1;
      const written = file.text.slice(start, literal.getEnd() - 1);
      for (const match of written.matchAll(/\S+/g)) {
        if (classes.has(match[0])) continue;
        add(
          path,
          placeOf(file, start + match.index),
          "unknown-class",
          `class ${quote(match[0])} is not one of the kit's: it has no style in the built file`,
        );
      }
    };

    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node)) {
        if (FORBIDDEN_GLOBALS.includes(node.text) && isValueReference(node)) {
          add(
            path,
            at(node),
            "forbidden-global",
            `${quote(node.text)} is not allowed in a deck: a deck runs without a network and ` +
              "does not run text as code",
          );
        } else if (node.text === "Function" && isCalled(node) && isValueReference(node)) {
          add(
            path,
            at(node),
            "forbidden-global",
            '"new Function" is not allowed in a deck: a deck does not run text as code',
          );
        }
      } else if (ts.isElementAccessExpression(node)) {
        const key = literalText(node.argumentExpression);
        if (
          key !== undefined &&
          (FORBIDDEN_GLOBALS.includes(key) || key === "Function") &&
          ts.isIdentifier(node.expression) &&
          GLOBAL_OBJECTS.includes(node.expression.text)
        ) {
          add(path, at(node), "forbidden-global", `${quote(key)} is not allowed in a deck`);
        }
      } else if (
        ts.isJsxAttribute(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "className"
      ) {
        className(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }

  analysis.diagnostics = sortDiagnostics(diagnostics, source.entry);
  return analysis;
}
