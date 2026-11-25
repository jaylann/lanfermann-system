import ts from "typescript";

import type { DeckError } from "./types";

/**
 * The presenter's notes in a deck's source, and what keeps a build from leaving them out for
 * certain. The rules, failing closed:
 *
 * 1. Every JSX attribute named `notes` is taken out, in every file, also on a part of the
 *    deck's own.
 * 2. Its value has to be written where it stands: a string, a template without placeholders,
 *    or plain markup. A variable would leave its text behind in the script, so it is an error.
 * 3. Nothing else may carry notes to a slide: no spread of an object that is not known, and no
 *    property named `notes` in an object.
 *
 * After a build, every text that was taken out is looked for in the script (`findLeaks`).
 */

/** A `notes` attribute in a deck's source. */
export type NotesAttribute = {
  file: string;
  /** The range of the whole attribute in the file's text: name and value. */
  start: number;
  end: number;
  /** Where it starts, counted from 1. */
  line: number;
  column: number;
  /** The texts it holds, or `undefined` when its value is not written out. */
  texts: string[] | undefined;
};

export type NotesScan = {
  attributes: NotesAttribute[];
  /** What breaks rule 2 or 3: `notes-not-literal`, `spread-on-slide` or `notes-property`. */
  errors: DeckError[];
};

/** The place of a position in a file, counted from 1 as an editor shows it. */
export function placeOf(file: ts.SourceFile, position: number): { line: number; column: number } {
  const { line, character } = file.getLineAndCharacterOfPosition(position);
  return { line: line + 1, column: character + 1 };
}

export function isNotesAttribute(node: ts.Node): node is ts.JsxAttribute {
  return ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && node.name.text === "notes";
}

/** An expression without what only the type checker reads: brackets, `as`, `satisfies`, `!`. */
export function unwrap(expression: ts.Expression): ts.Expression {
  let inner = expression;
  while (
    ts.isParenthesizedExpression(inner) ||
    ts.isAsExpression(inner) ||
    ts.isSatisfiesExpression(inner) ||
    ts.isNonNullExpression(inner)
  ) {
    inner = inner.expression;
  }
  return inner;
}

function isPlainLiteral(node: ts.Expression): boolean {
  return (
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.NullKeyword ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword
  );
}

/**
 * The texts of a value that is written out where it stands, or `undefined` as soon as a part
 * of it is computed or is a part of the deck's own (whose text would stand elsewhere).
 */
function inlineTexts(value: ts.Expression | ts.JsxChild): string[] | undefined {
  if (ts.isJsxText(value)) return [value.text];
  if (ts.isJsxExpression(value)) return value.expression ? inlineTexts(value.expression) : [];
  if (ts.isJsxFragment(value)) return textsOfAll(value.children);
  if (ts.isJsxElement(value) || ts.isJsxSelfClosingElement(value)) {
    const opening = ts.isJsxElement(value) ? value.openingElement : value;
    // `<b>`, `<br />`: markup. A capital letter names a component, whose text is elsewhere.
    if (!ts.isIdentifier(opening.tagName) || !/^[a-z]/.test(opening.tagName.text)) return undefined;
    const texts: string[] = [];
    for (const attribute of opening.attributes.properties) {
      if (ts.isJsxSpreadAttribute(attribute)) return undefined;
      if (attribute.initializer === undefined) continue;
      const part = inlineTexts(attribute.initializer);
      if (part === undefined) return undefined;
      texts.push(...part);
    }
    const inner = ts.isJsxElement(value) ? textsOfAll(value.children) : [];
    return inner === undefined ? undefined : [...texts, ...inner];
  }
  const inner = unwrap(value);
  if (ts.isStringLiteral(inner) || ts.isNoSubstitutionTemplateLiteral(inner)) return [inner.text];
  if (isPlainLiteral(inner)) return [];
  if (ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner) || ts.isJsxFragment(inner)) {
    return inlineTexts(inner);
  }
  return undefined;
}

function textsOfAll(children: readonly ts.JsxChild[]): string[] | undefined {
  const texts: string[] = [];
  for (const child of children) {
    const part = inlineTexts(child);
    if (part === undefined) return undefined;
    texts.push(...part);
  }
  return texts;
}

/**
 * The texts of a `notes` attribute, or `undefined` when its value is not written out. `notes`
 * alone (which is `true`) and `notes={null}` hold none.
 */
export function notesTexts(attribute: ts.JsxAttribute): string[] | undefined {
  return attribute.initializer === undefined ? [] : inlineTexts(attribute.initializer);
}

/** Whether a name is a parameter of a function around the node, or taken out of one. */
function isParameterName(node: ts.Identifier): boolean {
  const binds = (name: ts.BindingName): boolean =>
    ts.isIdentifier(name)
      ? name.text === node.text
      : name.elements.some((element) => !ts.isOmittedExpression(element) && binds(element.name));
  for (let above: ts.Node | undefined = node.parent; above; above = above.parent) {
    if (ts.isFunctionLike(above) && above.parameters.some((parameter) => binds(parameter.name))) {
      return true;
    }
  }
  return false;
}

/**
 * Whether what a spread hands on is known not to hold notes of its own: an object written out
 * with plain keys (a key `notes` in it is reported by itself), or the props of a part of the
 * deck's own, which come from where the part is used and are checked there.
 */
function isKnownSpread(expression: ts.Expression): boolean {
  const inner = unwrap(expression);
  if (ts.isIdentifier(inner)) return isParameterName(inner);
  if (!ts.isObjectLiteralExpression(inner)) return false;
  return inner.properties.every(
    (property) =>
      !ts.isSpreadAssignment(property) &&
      property.name !== undefined &&
      !ts.isComputedPropertyName(property.name),
  );
}

function isNotesKey(name: ts.PropertyName): boolean {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text === "notes";
  if (!ts.isComputedPropertyName(name)) return false;
  const key = unwrap(name.expression);
  return (
    (ts.isStringLiteral(key) || ts.isNoSubstitutionTemplateLiteral(key)) && key.text === "notes"
  );
}

/** Reads the notes out of a deck's parsed files, and says what breaks the rules above. */
export function scanNotes(files: ReadonlyMap<string, ts.SourceFile>): NotesScan {
  const scan: NotesScan = { attributes: [], errors: [] };
  for (const [path, file] of files) {
    const refuse = (node: ts.Node, code: string, message: string) => {
      scan.errors.push({
        kind: "notes",
        file: path,
        ...placeOf(file, node.getStart(file)),
        code,
        message,
      });
    };
    const visit = (node: ts.Node) => {
      if (isNotesAttribute(node)) {
        const start = node.getStart(file);
        const texts = notesTexts(node);
        scan.attributes.push({
          file: path,
          start,
          end: node.getEnd(),
          ...placeOf(file, start),
          texts,
        });
        if (texts === undefined) {
          refuse(
            node,
            "notes-not-literal",
            "notes have to be written out where they stand (a string, or plain markup): a " +
              "variable would leave its text in a file for the audience",
          );
        }
      } else if (ts.isJsxSpreadAttribute(node) && !isKnownSpread(node.expression)) {
        refuse(
          node,
          "spread-on-slide",
          "a spread of an object that is not written out here could carry notes: write the " +
            "props out",
        );
      } else if (
        ts.isObjectLiteralElementLike(node) &&
        ts.isObjectLiteralExpression(node.parent) &&
        node.name !== undefined &&
        isNotesKey(node.name)
      ) {
        refuse(
          node,
          "notes-property",
          "a property named notes could carry notes past the build for an audience: write " +
            "notes as an attribute on the slide, or give the property another name",
        );
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return scan;
}

/**
 * The deck's files with every `notes` attribute replaced by spaces of the same length, so
 * every other place in a file keeps its line and column.
 */
export function blankNotes(
  files: Readonly<Record<string, string>>,
  attributes: readonly NotesAttribute[],
): Record<string, string> {
  const blanked: Record<string, string> = { ...files };
  for (const { file, start, end } of attributes) {
    const text = blanked[file];
    if (text === undefined) continue;
    blanked[file] =
      text.slice(0, start) + text.slice(start, end).replace(/[^\r\n]/g, " ") + text.slice(end);
  }
  return blanked;
}

/**
 * Characters a bundler may write differently than the source does (it escapes them, or reads a
 * character reference), besides every control character.
 */
const UNSTABLE: ReadonlySet<string> = new Set([
  '"',
  "'",
  "`",
  "\\",
  "<",
  ">",
  "&",
  ";",
  "$",
  "{",
  "}",
  " ",
  " ",
  "﻿",
]);

/** From this length on a piece of a note is looked for in the built script. */
export const MIN_NEEDLE = 12;

/**
 * The pieces of a note to look for in a built script: the note cut at every character a
 * bundler may write differently and at every line break, each piece without the white space
 * around it. Pieces shorter than twelve characters say too little to be looked for.
 */
export function needlesOf(note: string): string[] {
  const pieces: string[] = [];
  let piece = "";
  for (const character of note) {
    if (character.charCodeAt(0) < 0x20 || UNSTABLE.has(character)) {
      pieces.push(piece);
      piece = "";
    } else {
      piece += character;
    }
  }
  pieces.push(piece);
  return pieces.map((part) => part.trim()).filter((part) => part.length >= MIN_NEEDLE);
}

/**
 * The notes whose words still stand in a built script. An empty list is what a build for an
 * audience has to show before it is handed out: the notes were taken out of the slides, and
 * their words are nowhere else in the deck either.
 */
export function findLeaks(js: string, attributes: readonly NotesAttribute[]): DeckError[] {
  return attributes
    .filter((note) =>
      (note.texts ?? []).some((text) => needlesOf(text).some((needle) => js.includes(needle))),
    )
    .map((note): DeckError => ({
      kind: "notes",
      file: note.file,
      line: note.line,
      column: note.column,
      code: "notes-in-audience-build",
      message:
        "words of these notes also stand elsewhere in the deck, so a file for the audience " +
        "would contain them: reword the notes or the slide",
    }));
}
