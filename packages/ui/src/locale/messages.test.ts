import { describe, expect, it } from "vitest";

import { de, en, getMessages, localeTags } from "./messages";

type Entry = { path: string; value: unknown };

/** Every leaf of a table with its path: `dialog.close`. */
function leaves(table: object, prefix = ""): Entry[] {
  return Object.entries(table).flatMap(([key, value]: [string, unknown]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null ? leaves(value, path) : [{ path, value }];
  });
}

/** What a leaf says: the string itself, or what its function returns for sample arguments. */
function said(value: unknown): unknown {
  return typeof value === "function" ? Reflect.apply(value, undefined, [2, 5, 7]) : value;
}

describe("the locale tables", () => {
  it("say the same things in both languages", () => {
    const paths = (table: object) => leaves(table).map((entry) => entry.path);
    expect(paths(en)).toEqual(paths(de));
  });

  it("keep a function a function and a string a string", () => {
    const kinds = (table: object) => leaves(table).map((entry) => typeof entry.value);
    expect(kinds(en)).toEqual(kinds(de));
  });

  it.each([
    ["de", de],
    ["en", en],
  ])("leave no word empty in %s", (_name, table) => {
    for (const { path, value } of leaves(table)) {
      const text = said(value);
      expect(typeof text, path).toBe("string");
      expect(String(text).trim(), path).not.toBe("");
    }
  });

  it("keep a pattern's places in both languages", () => {
    const places = (table: object) =>
      leaves(table).map(({ value }) =>
        typeof value === "string" ? (value.match(/\{\w+\}/g) ?? []).toSorted() : [],
      );
    expect(places(en)).toEqual(places(de));
  });

  it("hand out the table of a language", () => {
    expect(getMessages("de")).toBe(de);
    expect(getMessages("en")).toBe(en);
    expect(localeTags).toEqual({ de: "de-DE", en: "en-US" });
  });
});
