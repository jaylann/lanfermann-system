/**
 * The pure parts of what scripts/slides/build-player.ts writes beside the prebuilt player: the
 * list of classes a stylesheet defines, the `@font-face` rules, the notices. No file is read or
 * written here, so each can be tested.
 */

/** Turns a CSS identifier as it is written (`p-\[128px\]`, `\32 xl\:flex`) into its name. */
function unescapeIdentifier(written: string): string {
  return written.replace(/\\([0-9a-fA-F]{1,6})\s?|\\(.)/g, (_match, hex?: string, char?: string) =>
    hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : (char ?? ""),
  );
}

/** One class in a selector: a dot, then name characters and escapes. */
const CLASS = /\.((?:\\[0-9a-fA-F]{1,6}\s?|\\[^0-9a-fA-F\n]|[\w-]|[\u{80}-\u{10ffff}])+)/gu;

/**
 * The class names a stylesheet defines, sorted: every `.name` in the selector of a rule. What
 * stands in a declaration (`0.5rem`), in a string or in the head of an at-rule is not a class.
 * This list is the vocabulary a deck may use with the prebuilt stylesheet.
 */
export function classesOf(css: string): string[] {
  const bare = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
  const found = new Set<string>();
  let start = 0;
  for (let index = 0; index < bare.length; index += 1) {
    const char = bare[index];
    if (char === ";" || char === "}") {
      start = index + 1;
    } else if (char === "{") {
      // What stands before a brace is a rule's head: a selector, or an at-rule's own words.
      const head = bare.slice(start, index).trim();
      start = index + 1;
      if (head.startsWith("@")) continue;
      for (const match of head.matchAll(CLASS)) {
        const written = match[1];
        // A name begins with a letter, `_`, `-` or an escape; `.5` is a number.
        if (written && !/^\d/.test(written)) found.add(unescapeIdentifier(written));
      }
    }
  }
  return [...found].sort();
}

/** One face of a family, as Fontsource's stylesheet describes it. */
export type Face = {
  family: string;
  style: string;
  weight: string;
  unicodeRange: string;
};

/**
 * Reads one face out of a Fontsource stylesheet by the name in the comment above its rule
 * (`sofia-sans-latin-wght-normal`).
 */
export function faceOf(css: string, name: string): Face {
  const rule = new RegExp(`/\\* ${name} \\*/\\s*@font-face\\s*\\{([^}]*)\\}`).exec(css)?.[1];
  if (rule === undefined) throw new Error(`No @font-face named ${name} in the stylesheet.`);
  const value = (property: string) => {
    const found = new RegExp(`${property}:\\s*([^;]+);`).exec(rule)?.[1];
    if (found === undefined) throw new Error(`The @font-face ${name} has no ${property}.`);
    return found.trim().replace(/^['"]|['"]$/g, "");
  };
  return {
    family: value("font-family"),
    style: value("font-style"),
    weight: value("font-weight"),
    unicodeRange: value("unicode-range"),
  };
}

/**
 * One `@font-face` rule with `src` as its source: a data URL for the stylesheet that goes into a
 * single file, a relative path for the one that stands beside its fonts. `font-display: block`:
 * a slide is never drawn in a fallback face first, on screen or in a PDF.
 */
export function fontFaceRule(face: Face, src: string): string {
  return [
    "@font-face {",
    `  font-family: "${face.family}";`,
    `  font-style: ${face.style};`,
    `  font-weight: ${face.weight};`,
    "  font-display: block;",
    `  src: url(${src}) format("woff2-variations");`,
    `  unicode-range: ${face.unicodeRange};`,
    "}",
    "",
  ].join("\n");
}

/** Something inside the prebuilt player that someone else made. */
export type Notice = {
  name: string;
  /** Where in the player it is. */
  part: string;
  /** The licence, as an SPDX identifier. */
  license: string;
  /** The copyright lines, as the work states them. None for a work in the public domain. */
  copyright: readonly string[];
};

/** The notices file: who made what is inside, under which licence, and the licences' texts. */
export function renderNotices(notices: readonly Notice[], texts: Record<string, string>): string {
  const lines = [
    "The prebuilt player of @lanfermann/ui (player.global.js, player.css, fonts.css,",
    "fonts.inline.css and the files under fonts/) contains the works below. The player itself",
    "is under the MIT licence of @lanfermann/ui; the Lanfermann marks are not (TRADEMARK.md).",
    "",
  ];
  for (const notice of notices) {
    lines.push(`${notice.name} (${notice.license})`, `  ${notice.part}`);
    for (const line of notice.copyright) lines.push(`  ${line}`);
    lines.push("");
  }
  for (const [license, text] of Object.entries(texts)) {
    lines.push("-".repeat(72), license, "-".repeat(72), "", text.trim(), "");
  }
  return lines.join("\n");
}
