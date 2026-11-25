import ts from "typescript";

/** The named character references a title is likely to use. Any other stays as written. */
const ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  shy: "­",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  euro: "€",
  bdquo: "„",
  ldquo: "“",
  rdquo: "”",
  sbquo: "‚",
  lsquo: "‘",
  rsquo: "’",
  laquo: "«",
  raquo: "»",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  Auml: "Ä",
  Ouml: "Ö",
  Uuml: "Ü",
  szlig: "ß",
};

/** Text as JSX reads it: `&amp;` is `&`, `&#8364;` and `&#x20ac;` are `€`. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);/g, (whole, name: string) => {
    if (name.startsWith("#")) {
      const code = name.startsWith("#x")
        ? Number.parseInt(name.slice(2), 16)
        : Number.parseInt(name.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[name] ?? whole;
  });
}

/**
 * The text between two tags as JSX keeps it: the white space around a line break goes, and the
 * lines that are left are joined by one space.
 */
function cleanJsxText(raw: string): string {
  const lines = raw.split(/\r\n|\n|\r/);
  const kept: string[] = [];
  lines.forEach((line, index) => {
    let text = line.replace(/\t/g, " ");
    if (index > 0) text = text.trimStart();
    if (index < lines.length - 1) text = text.trimEnd();
    if (text !== "") kept.push(text);
  });
  return kept.join(" ");
}

/** The value of a string written as an expression, or `undefined` for anything computed. */
export function literalText(expression: ts.Expression): string | undefined {
  let inner = expression;
  while (ts.isParenthesizedExpression(inner)) inner = inner.expression;
  return ts.isStringLiteral(inner) || ts.isNoSubstitutionTemplateLiteral(inner)
    ? inner.text
    : undefined;
}

/**
 * The words of a piece of JSX that is written out: strings, text, and elements around them.
 * A `<br />` counts as a space. `undefined` as soon as a part is computed.
 */
export function staticText(node: ts.Expression | ts.JsxChild): string | undefined {
  if (ts.isJsxText(node)) return decodeEntities(cleanJsxText(node.text));
  if (ts.isJsxExpression(node)) return node.expression ? staticText(node.expression) : "";
  if (ts.isJsxSelfClosingElement(node)) return isBreak(node.tagName) ? " " : "";
  if (ts.isJsxElement(node)) {
    return isBreak(node.openingElement.tagName) ? " " : textOfChildren(node.children);
  }
  if (ts.isJsxFragment(node)) return textOfChildren(node.children);
  if (ts.isParenthesizedExpression(node)) return staticText(node.expression);
  if (ts.isNumericLiteral(node)) return node.text;
  return literalText(node);
}

function isBreak(tag: ts.JsxTagNameExpression): boolean {
  return ts.isIdentifier(tag) && tag.text === "br";
}

function textOfChildren(children: readonly ts.JsxChild[]): string | undefined {
  let text = "";
  for (const child of children) {
    const part = staticText(child);
    if (part === undefined) return undefined;
    text += part;
  }
  return text;
}

/**
 * The value of an attribute that is written out (`title="…"`, `title={"…"}`, `title={<>…</>}`),
 * or `undefined` when it is computed. An attribute without a value is the empty text.
 */
export function attributeText(attribute: ts.JsxAttribute): string | undefined {
  const value = attribute.initializer;
  if (value === undefined) return "";
  // An attribute's string is read like text between tags: with its character references.
  if (ts.isStringLiteral(value)) return decodeEntities(value.text);
  return staticText(value);
}
