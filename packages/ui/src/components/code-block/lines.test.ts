import { describe, expect, it } from "vitest";

import { highlightLines } from "./highlight";
import { copyText, lineKinds, parseLines, trimCode } from "./lines";

describe("parseLines", () => {
  it("reads a number, a string of ranges and a list", () => {
    expect([...parseLines(3)]).toEqual([3]);
    expect([...parseLines("2-4, 7")]).toEqual([2, 3, 4, 7]);
    expect([...parseLines([1, [5, 6]])]).toEqual([1, 5, 6]);
  });

  it("ignores what is not a line", () => {
    expect([...parseLines("0, x, -1")]).toEqual([]);
    expect([...parseLines(undefined)]).toEqual([]);
  });

  it("reads a range written backwards", () => {
    expect([...parseLines("4-2")]).toEqual([2, 3, 4]);
  });
});

describe("copyText", () => {
  it("leaves out the removed lines and the last line break", () => {
    expect(copyText("a\nb\nc\n", "2")).toBe("a\nc");
  });

  it("keeps every line when nothing was removed", () => {
    expect(copyText("a\r\nb")).toBe("a\nb");
  });
});

describe("lineKinds", () => {
  it("lets a change win over a mark", () => {
    expect(lineKinds(3, { marked: "1-3", added: 2, removed: 3 })).toEqual([
      "marked",
      "added",
      "removed",
    ]);
  });
});

describe("highlightLines", () => {
  const samples = {
    tsx: 'export const a = <Button variant="primary">Hi</Button>;',
    ts: "const total: number = 3;",
    jsx: "const a = <a href={url}>x</a>;",
    js: "const a = 1;",
    json: '{ "a": true }',
    css: ".a { color: red; }",
    html: '<a href="/">x</a>',
    sh: "bun add @lanfermann/ui",
    swift: 'let title: String = "Kino"',
    py: "def total(): return 1",
    yaml: "name: CI",
    sql: "SELECT 1;",
    md: "# Titel",
    diff: "+ a",
  } as const;

  it.each(Object.entries(samples))("colours %s", (language, code) => {
    const [line] = highlightLines(code, language as keyof typeof samples);
    expect(line?.map((token) => token.content).join("")).toBe(code);
    // More than one colour: the grammar was found and the engine could read it.
    expect(new Set(line?.map((token) => token.color)).size).toBeGreaterThan(1);
  });

  it("keeps empty lines and plain text", () => {
    expect(highlightLines("a\n\nb", "text")).toEqual([[{ content: "a" }], [], [{ content: "b" }]]);
    expect(trimCode("a\n")).toBe("a");
  });
});
