import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  assetKey,
  dataUrl,
  DeckReadError,
  isDeckPath,
  readDeckDir,
  resolveImport,
  resolveInDeck,
} from "./source";
import { fixturePath } from "./testing";

const made: string[] = [];
async function folder(files: Record<string, string | Uint8Array>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "lf-slides-test-"));
  made.push(dir);
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(dir, path, ".."), { recursive: true });
    await writeFile(join(dir, path), content);
  }
  return dir;
}
afterEach(async () => {
  for (const dir of made.splice(0)) await rm(dir, { recursive: true, force: true });
});

describe("readDeckDir", () => {
  it("reads code as text and pictures as bytes, by their path in the folder", async () => {
    const source = await readDeckDir(fixturePath("pictures"));
    expect(source.entry).toBe("deck.tsx");
    expect(Object.keys(source.files)).toEqual(["deck.tsx", "parts/werkbank.tsx"]);
    expect(Object.keys(source.images)).toEqual(["bilder/punkt.png", "bilder/werkbank.svg"]);
    expect(source.files["deck.tsx"]).toContain("export default");
    expect(source.images["bilder/punkt.png"]).toBeInstanceOf(Uint8Array);
    expect(source.images["bilder/punkt.png"]?.byteLength).toBe(69);
  });

  it("leaves out what is no part of a deck", async () => {
    const dir = await folder({
      "deck.tsx": "export default null;",
      "package.json": "{}",
      "tsconfig.json": "{}",
      "notizen.md": "# Notizen",
      ".DS_Store": "x",
      ".git/config": "x",
      "node_modules/react/index.ts": "export {};",
      "slides-out/deck.html": "<html>",
      "BILD.PNG": new Uint8Array([1, 2, 3]),
    });
    const source = await readDeckDir(dir);
    expect(Object.keys(source.files)).toEqual(["deck.tsx"]);
    expect(Object.keys(source.images)).toEqual(["BILD.PNG"]);
  });

  it("refuses a symbolic link, to a file or to a folder", async () => {
    const outside = await folder({ "geheim.ts": "export const geheim = 1;" });
    const dir = await folder({ "deck.tsx": "export default null;" });
    await symlink(join(outside, "geheim.ts"), join(dir, "geheim.ts"));
    await expect(readDeckDir(dir)).rejects.toThrow(DeckReadError);
    await expect(readDeckDir(dir)).rejects.toThrow('"geheim.ts" is a symbolic link');

    const other = await folder({ "deck.tsx": "export default null;" });
    await symlink(outside, join(other, "parts"));
    await expect(readDeckDir(other)).rejects.toThrow('"parts" is a symbolic link');
  });

  it("refuses code that is not UTF-8", async () => {
    const dir = await folder({ "deck.tsx": new Uint8Array([0x61, 0xff, 0xfe, 0x62]) });
    await expect(readDeckDir(dir)).rejects.toThrow('"deck.tsx" is not valid UTF-8');
  });

  it("says when the folder is not there, or is a file", async () => {
    const dir = await folder({ "deck.tsx": "export default null;" });
    await expect(readDeckDir(join(dir, "fehlt"))).rejects.toThrow(DeckReadError);
    await expect(readDeckDir(join(dir, "deck.tsx"))).rejects.toThrow("is not a folder");
  });
});

describe("paths", () => {
  it.each(["deck.tsx", "parts/eins.tsx", "bilder/ein bild.png", "a/b/c/d.ts"])(
    "takes %j as a deck's path",
    (path) => expect(isDeckPath(path)).toBe(true),
  );

  it.each([
    "",
    "/deck.tsx",
    "../deck.tsx",
    "parts/../../deck.tsx",
    "./deck.tsx",
    "parts//eins.tsx",
    "parts\\eins.tsx",
    "C:/deck.tsx",
    "c:deck.tsx",
    "parts/a\u0000.tsx",
    "parts/a\n.tsx",
    `${"a/".repeat(300)}deck.tsx`,
  ])("refuses %j as a deck's path", (path) => expect(isDeckPath(path)).toBe(false));

  it("resolves a relative import from the importing file's folder", () => {
    expect(resolveInDeck("deck.tsx", "./parts/eins")).toBe("parts/eins");
    expect(resolveInDeck("parts/eins.tsx", "../bilder/a.png")).toBe("bilder/a.png");
    expect(resolveInDeck("parts/tief/eins.tsx", "./../../deck")).toBe("deck");
    expect(resolveInDeck("deck.tsx", "../oben")).toBeUndefined();
    expect(resolveInDeck("parts/eins.tsx", "../../oben")).toBeUndefined();
    expect(resolveInDeck("parts/eins.tsx", "./a/../../../oben")).toBeUndefined();
  });

  it("finds what an import means", () => {
    const files = { "deck.tsx": "", "eins.ts": "", "parts/index.tsx": "", "constructor.ts": "" };
    expect(resolveImport(files, "deck.tsx", "./eins")).toEqual({ kind: "code", path: "eins.ts" });
    expect(resolveImport(files, "deck.tsx", "./eins.ts")).toEqual({
      kind: "code",
      path: "eins.ts",
    });
    expect(resolveImport(files, "deck.tsx", "./parts")).toEqual({
      kind: "code",
      path: "parts/index.tsx",
    });
    expect(resolveImport(files, "parts/index.tsx", "..")).toEqual({ kind: "missing" });
    expect(resolveImport(files, "deck.tsx", "./bild.PNG")).toEqual({
      kind: "image",
      path: "bild.PNG",
    });
    expect(resolveImport(files, "deck.tsx", "./fehlt")).toEqual({ kind: "missing" });
    expect(resolveImport(files, "deck.tsx", "./fehlt.tsx")).toEqual({ kind: "missing" });
    expect(resolveImport(files, "deck.tsx", "./daten.json")).toEqual({ kind: "unsupported" });
    expect(resolveImport(files, "deck.tsx", "../oben")).toEqual({ kind: "outside" });
    // A name every object has is no file of the deck.
    expect(resolveImport({}, "deck.tsx", "./constructor")).toEqual({ kind: "missing" });
    expect(resolveImport({}, "deck.tsx", "./__proto__")).toEqual({ kind: "missing" });
  });

  it("names a picture by its path and carries it as a data URL of its kind", () => {
    expect(assetKey("bilder/a.png")).toBe("./bilder/a.png");
    expect(dataUrl("a.PNG", new Uint8Array([1, 2, 3]))).toBe("data:image/png;base64,AQID");
    expect(dataUrl("a.svg", new TextEncoder().encode("<svg/>"))).toBe(
      "data:image/svg+xml;base64,PHN2Zy8+",
    );
    expect(dataUrl("a.jpeg", new Uint8Array())).toBe("data:image/jpeg;base64,");
  });
});
