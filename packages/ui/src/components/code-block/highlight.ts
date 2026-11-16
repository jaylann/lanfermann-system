import {
  createHighlighterCoreSync,
  type HighlighterCore,
  type ThemeRegistration,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import css from "shiki/langs/css.mjs";
import diff from "shiki/langs/diff.mjs";
import dotenv from "shiki/langs/dotenv.mjs";
import html from "shiki/langs/html.mjs";
import ini from "shiki/langs/ini.mjs";
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import jsx from "shiki/langs/jsx.mjs";
import markdown from "shiki/langs/markdown.mjs";
import powershell from "shiki/langs/powershell.mjs";
import python from "shiki/langs/python.mjs";
import shellscript from "shiki/langs/shellscript.mjs";
import sql from "shiki/langs/sql.mjs";
import swift from "shiki/langs/swift.mjs";
import toml from "shiki/langs/toml.mjs";
import tsx from "shiki/langs/tsx.mjs";
import typescript from "shiki/langs/typescript.mjs";
import yaml from "shiki/langs/yaml.mjs";

import type { CodeToken } from "./code-lines-view";

/*
 * Highlighting runs where the block is rendered. In a Next.js Server Component that is the
 * server, so neither Shiki nor its grammars reach the browser; only the coloured spans do.
 * No "use client" here, and none may be added.
 *
 * The engine is Shiki's JavaScript one (no WebAssembly), created synchronously, so a block renders
 * in one pass on the server and in the workshop alike.
 */

/** The languages a block can colour, by the names people write, and how many lines it may hold. */
const languages = {
  tsx: "tsx",
  ts: "typescript",
  typescript: "typescript",
  jsx: "jsx",
  js: "javascript",
  javascript: "javascript",
  json: "json",
  css: "css",
  html: "html",
  sh: "shellscript",
  bash: "shellscript",
  shell: "shellscript",
  zsh: "shellscript",
  ps1: "powershell",
  powershell: "powershell",
  env: "dotenv",
  dotenv: "dotenv",
  toml: "toml",
  ini: "ini",
  swift: "swift",
  py: "python",
  python: "python",
  yaml: "yaml",
  yml: "yaml",
  sql: "sql",
  md: "markdown",
  markdown: "markdown",
  diff: "diff",
  text: "text",
} as const;

export type CodeLanguage = keyof typeof languages;

/** Whether a language is a shell: its block gets the terminal symbol, a one-liner gets a prompt. */
export function isShell(language: CodeLanguage) {
  return languages[language] === "shellscript";
}

const v = (role: string) => `var(--lf-code-${role})`;

/**
 * Ten roles instead of an editor theme's fifty: code here is read, not edited. The colours are
 * CSS variables (src/styles/code.css), so the same spans read right on every ground.
 */
const theme: ThemeRegistration = {
  name: "lanfermann",
  type: "light",
  colors: { "editor.foreground": v("text"), "editor.background": "transparent" },
  tokenColors: [
    { settings: { foreground: v("text") } },
    {
      scope: ["comment", "punctuation.definition.comment", "string.quoted.docstring"],
      settings: { foreground: v("comment"), fontStyle: "italic" },
    },
    {
      scope: [
        "punctuation",
        "meta.brace",
        "keyword.operator",
        "storage.type.function.arrow",
        "meta.tag.sgml.doctype",
      ],
      settings: { foreground: v("punct") },
    },
    {
      scope: [
        "keyword",
        "storage",
        "storage.type",
        "storage.modifier",
        "keyword.operator.new",
        "keyword.operator.expression",
        "keyword.operator.word",
        "keyword.operator.logical.python",
        "variable.language",
        "markup.heading",
        "entity.name.section",
      ],
      settings: { foreground: v("keyword") },
    },
    {
      scope: [
        "string",
        "punctuation.definition.string",
        "string.regexp",
        "markup.inline.raw",
        "markup.fenced_code",
        "markup.inserted",
      ],
      settings: { foreground: v("string") },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "constant.other.color",
        "support.constant",
        "variable.other.enummember",
        "constant.other.option",
        "keyword.other.unit",
      ],
      settings: { foreground: v("number") },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call entity.name.function",
        "entity.name.command",
        "markup.deleted",
      ],
      settings: { foreground: v("function") },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "entity.other.inherited-class",
        "support.type",
        "support.class",
        "storage.type.primitive",
        "entity.name.namespace",
      ],
      settings: { foreground: v("type") },
    },
    {
      scope: ["entity.name.tag", "support.class.component", "punctuation.definition.tag"],
      settings: { foreground: v("tag") },
    },
    {
      scope: [
        "entity.other.attribute-name",
        "support.type.property-name",
        "meta.object-literal.key",
        "entity.name.tag.yaml",
        "variable.other.property",
      ],
      settings: { foreground: v("attribute") },
    },
    { scope: ["markup.bold"], settings: { fontStyle: "bold" } },
    { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
  ],
};

let highlighter: HighlighterCore | undefined;

function getHighlighter() {
  highlighter ??= createHighlighterCoreSync({
    themes: [theme],
    langs: [
      css,
      diff,
      dotenv,
      html,
      ini,
      javascript,
      json,
      jsx,
      markdown,
      powershell,
      python,
      shellscript,
      sql,
      swift,
      toml,
      tsx,
      typescript,
      yaml,
    ],
    // ES2018, not the default: JavaScriptCore (Safari, Bun) misreads the `v`-flag patterns the
    // newer targets emit, and TSX came out uncoloured there. ES2018 tokenizes the same everywhere.
    engine: createJavaScriptRegexEngine({ target: "ES2018" }),
  });
  return highlighter;
}

/**
 * Runs `tokenize` with a clock that stands still. Shiki's tokenizer reads `Date.now()` once per
 * line to enforce a time limit, even when the limit is off. Next.js with `cacheComponents`
 * refuses a page that reads the clock while it is prerendered (the build fails with "Next.js
 * encountered the unstable value `Date.now()`"), and rightly: a limit that trips cuts a slow
 * line short and the page changes from one build to the next. With the limit off
 * (`tokenizeTimeLimit: 0`) the clock decides nothing, so it is answered with a constant for the
 * length of this one synchronous call, and the real `Date.now` is put back before anything else
 * can run.
 */
function withoutClock<T>(tokenize: () => T): T {
  const now = Date.now;
  Date.now = () => 0;
  try {
    return tokenize();
  } finally {
    Date.now = now;
  }
}

export type { CodeToken };

/**
 * Splits code into lines of coloured runs. Neighbouring runs of the same colour are merged, and
 * so are spaces into the run before them, so a line is a handful of spans, not one per token.
 */
export function highlightLines(code: string, language: CodeLanguage = "text"): CodeToken[][] {
  const lang = languages[language];
  if (lang === "text") return code.split("\n").map((line) => (line ? [{ content: line }] : []));
  const lines = withoutClock(() =>
    getHighlighter().codeToTokensBase(code, { lang, theme: "lanfermann", tokenizeTimeLimit: 0 }),
  );
  return lines.map((line) => {
    const merged: CodeToken[] = [];
    for (const token of line) {
      const next: CodeToken = {
        content: token.content,
        color: token.color,
        italic: Boolean((token.fontStyle ?? 0) & 1),
        bold: Boolean((token.fontStyle ?? 0) & 2),
      };
      const last = merged.at(-1);
      const blank = next.content.trim() === "";
      if (
        last &&
        (blank ||
          (last.color === next.color && last.italic === next.italic && last.bold === next.bold))
      ) {
        last.content += next.content;
      } else {
        merged.push(next);
      }
    }
    return merged;
  });
}
