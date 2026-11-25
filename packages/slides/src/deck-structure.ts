import ts from "typescript";

import { attributeText } from "./jsx-text";
import { notesTexts, placeOf, unwrap } from "./notes";
import type { Diagnostic } from "./types";

/** The package a deck takes its parts from. */
export const KIT_MODULE = "@lanfermann/ui/slides";

/** One slide of a deck, as its source names it. */
export type SlideInfo = {
  /** Counted from 0, in the order the player shows them. */
  index: number;
  /** The slide's `id`, if it is written out: what `#/<id>` in an address means. */
  id?: string;
  hasNotes: boolean;
  /** Where the slide's element starts in the entry file, counted from 1. */
  line: number;
  column: number;
};

export type DeckStructure = {
  title?: string;
  lang?: string;
  slides: SlideInfo[];
  /** Where the `notes` attributes of the slides start: the ones a player reads. */
  slideNotes: Set<number>;
  diagnostics: Diagnostic[];
};

/** What a file's imports call the things this check has to recognise. */
type Bindings = {
  /** Local name to the kit's export it stands for. */
  kit: Map<string, string>;
  kitNamespaces: Set<string>;
  /** Local names of React's `Fragment`. */
  fragments: Set<string>;
  /** Local names of React itself (`import React`, `import * as React`). */
  react: Set<string>;
};

function bindingsOf(file: ts.SourceFile): Bindings {
  const bindings: Bindings = {
    kit: new Map(),
    kitNamespaces: new Set(),
    fragments: new Set(),
    react: new Set(),
  };
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const from = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (!clause || (from !== KIT_MODULE && from !== "react")) continue;
    if (clause.name && from === "react") bindings.react.add(clause.name.text);
    const named = clause.namedBindings;
    if (!named) continue;
    if (ts.isNamespaceImport(named)) {
      (from === "react" ? bindings.react : bindings.kitNamespaces).add(named.name.text);
      continue;
    }
    for (const element of named.elements) {
      const imported = (element.propertyName ?? element.name).text;
      if (from === KIT_MODULE) bindings.kit.set(element.name.text, imported);
      else if (imported === "Fragment") bindings.fragments.add(element.name.text);
    }
  }
  return bindings;
}

/** The kit's export a tag stands for (`Deck`, `S.Deck`), or `undefined` for any other tag. */
function kitExportOf(tag: ts.JsxTagNameExpression, bindings: Bindings): string | undefined {
  if (ts.isIdentifier(tag)) return bindings.kit.get(tag.text);
  if (
    ts.isPropertyAccessExpression(tag) &&
    ts.isIdentifier(tag.expression) &&
    bindings.kitNamespaces.has(tag.expression.text)
  ) {
    return tag.name.text;
  }
  return undefined;
}

function isFragmentTag(tag: ts.JsxTagNameExpression, bindings: Bindings): boolean {
  if (ts.isIdentifier(tag)) return bindings.fragments.has(tag.text);
  return (
    ts.isPropertyAccessExpression(tag) &&
    ts.isIdentifier(tag.expression) &&
    bindings.react.has(tag.expression.text) &&
    tag.name.text === "Fragment"
  );
}

/** What a file exports by default, as written: the expression, or the name it exports. */
function defaultExportOf(file: ts.SourceFile): ts.Expression | undefined {
  for (const statement of file.statements) {
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) return statement.expression;
    if (
      ts.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      const named = statement.exportClause.elements.find(
        (element) => element.name.text === "default",
      );
      const local = named ? (named.propertyName ?? named.name) : undefined;
      if (local && ts.isIdentifier(local)) return local;
    }
  }
  return undefined;
}

/** The value a `const` of the file's top level is given, by its name. */
function constOf(file: ts.SourceFile, name: string): ts.Expression | undefined {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if ((statement.declarationList.flags & ts.NodeFlags.Const) === 0) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        return declaration.initializer;
      }
    }
  }
  return undefined;
}

const LANGUAGE_TAG = /^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$/;

/**
 * Reads the deck out of its entry file without running it: the `<Deck>` the file exports by
 * default (directly or through one `const`), its title and language, and its slides, one per
 * child. A child that is computed cannot be counted, so it is a diagnostic.
 */
export function readStructure(file: ts.SourceFile, path: string): DeckStructure {
  const structure: DeckStructure = { slides: [], slideNotes: new Set(), diagnostics: [] };
  const report = (position: number, code: string, message: string) => {
    structure.diagnostics.push({
      file: path,
      ...placeOf(file, position),
      code,
      message,
      severity: "error",
    });
  };

  const exported = defaultExportOf(file);
  if (!exported) {
    report(0, "no-default-deck", `${path} has no default export: it has to be a <Deck> element`);
    return structure;
  }
  let value = unwrap(exported);
  if (ts.isIdentifier(value)) {
    const assigned = constOf(file, value.text);
    if (assigned) value = unwrap(assigned);
  }
  const bindings = bindingsOf(file);
  const opening = ts.isJsxElement(value)
    ? value.openingElement
    : ts.isJsxSelfClosingElement(value)
      ? value
      : undefined;
  if (!opening || kitExportOf(opening.tagName, bindings) !== "Deck") {
    report(
      exported.getStart(file),
      "no-default-deck",
      `the default export of ${path} is not a <Deck> element from ${KIT_MODULE} ` +
        "(written directly, or through one const)",
    );
    return structure;
  }

  for (const attribute of opening.attributes.properties) {
    if (ts.isJsxSpreadAttribute(attribute)) {
      report(
        attribute.getStart(file),
        "deck-prop-not-literal",
        "a spread on <Deck> hides its title and language: write the props out",
      );
      continue;
    }
    if (!ts.isIdentifier(attribute.name)) continue;
    const name = attribute.name.text;
    if (name !== "title" && name !== "lang") continue;
    const text = attributeText(attribute)
      ?.replace(/[ \t\r\n]+/g, " ")
      .trim();
    if (text === undefined || text === "") {
      report(
        attribute.getStart(file),
        "deck-prop-not-literal",
        `the ${name} of the deck has to be written out: the file's name and title are made from it`,
      );
    } else if (name === "title") {
      structure.title = text;
    } else if (LANGUAGE_TAG.test(text)) {
      structure.lang = text;
    } else {
      report(
        attribute.getStart(file),
        "deck-prop-not-literal",
        'lang has to be a language tag such as "de" or "en-GB"',
      );
    }
  }

  const slide = (element: ts.JsxOpeningLikeElement) => {
    const info: SlideInfo = {
      index: structure.slides.length,
      hasNotes: false,
      ...placeOf(file, element.getStart(file)),
    };
    for (const attribute of element.attributes.properties) {
      if (ts.isJsxSpreadAttribute(attribute) || !ts.isIdentifier(attribute.name)) continue;
      if (attribute.name.text === "notes") {
        structure.slideNotes.add(attribute.getStart(file));
        // Notes that are computed are an error of their own; they are notes all the same.
        info.hasNotes = notesTexts(attribute)?.some((text) => text.trim() !== "") ?? true;
      } else if (attribute.name.text === "id") {
        const id = attributeText(attribute);
        if (id !== undefined && id !== "") info.id = id;
      }
    }
    structure.slides.push(info);
  };

  const children = (nodes: readonly ts.JsxChild[]) => {
    for (const child of nodes) {
      if (ts.isJsxText(child)) continue;
      if (ts.isJsxExpression(child)) {
        // `{/* a comment */}` has no expression.
        if (child.expression) {
          report(
            child.getStart(file),
            "slides-not-static",
            "a child of <Deck> has to be written out as an element: slides that are computed " +
              "cannot be counted or named before the deck runs",
          );
        }
        continue;
      }
      if (ts.isJsxFragment(child)) {
        children(child.children);
      } else if (ts.isJsxElement(child)) {
        if (isFragmentTag(child.openingElement.tagName, bindings)) children(child.children);
        else slide(child.openingElement);
      } else if (!isFragmentTag(child.tagName, bindings)) {
        slide(child);
      }
    }
  };
  if (ts.isJsxElement(value)) children(value.children);
  return structure;
}
