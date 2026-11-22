import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import { isTheme, resolveMode, THEME_STORAGE_KEY, themeScript } from "./theme-mode";

/** Runs the <head> script against a stand-in browser and returns the mode it set. */
function runScript({
  stored,
  systemDark = false,
  storageThrows = false,
  noMatchMedia = false,
}: {
  stored?: string;
  systemDark?: boolean;
  storageThrows?: boolean;
  noMatchMedia?: boolean;
}) {
  const attributes = new Map<string, string>();
  const localStorage = {
    getItem(key: string) {
      if (storageThrows) throw new Error("SecurityError");
      return key === THEME_STORAGE_KEY ? (stored ?? null) : null;
    },
  };
  const matchMedia = noMatchMedia
    ? undefined
    : (query: string) => ({ matches: query === "(prefers-color-scheme: dark)" && systemDark });
  const document = {
    documentElement: { setAttribute: (name: string, value: string) => attributes.set(name, value) },
  };
  runInNewContext(themeScript, { localStorage, matchMedia, document, window: { matchMedia } });
  return attributes.get("data-mode");
}

describe("themeScript", () => {
  it("takes a stored choice of light or dark", () => {
    expect(runScript({ stored: "dark" })).toBe("dark");
    expect(runScript({ stored: "light", systemDark: true })).toBe("light");
  });

  it("follows the system for 'system', nothing stored, or something unknown", () => {
    expect(runScript({ stored: "system", systemDark: true })).toBe("dark");
    expect(runScript({ systemDark: true })).toBe("dark");
    expect(runScript({ systemDark: false })).toBe("light");
    expect(runScript({ stored: "sepia", systemDark: true })).toBe("dark");
  });

  it("still follows the system when storage is refused", () => {
    expect(runScript({ storageThrows: true, systemDark: true })).toBe("dark");
  });

  it("falls back to light without matchMedia", () => {
    expect(runScript({ noMatchMedia: true })).toBe("light");
  });
});

describe("resolveMode", () => {
  it("resolves the system's choice and keeps the others", () => {
    expect(resolveMode("system", true)).toBe("dark");
    expect(resolveMode("system", false)).toBe("light");
    expect(resolveMode("dark", false)).toBe("dark");
    expect(resolveMode("light", true)).toBe("light");
  });

  it("knows the three choices", () => {
    expect(["system", "light", "dark"].every(isTheme)).toBe(true);
    expect(isTheme("ink")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});
