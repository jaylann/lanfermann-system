import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { kitVersion } from "./kit";
import {
  type DeckPackage,
  PackageError,
  packDeck,
  parsePackage,
  serializePackage,
  slugOf,
} from "./pack";
import { MAX_IMAGE_BYTES } from "./source";
import { deckWith, describeWithKit, fixture } from "./testing";
import { version } from "./version";

describe("slugOf", () => {
  it.each([
    ["Der digitale Handschlag", "der-digitale-handschlag"],
    ["Größe, Maß & Übermut", "groesse-mass-uebermut"],
    ["ÄÖÜ ẞ", "aeoeue-ss"],
    ["Café  Crème: 2026!", "cafe-creme-2026"],
    ["  --Schon--ein--Slug--  ", "schon-ein-slug"],
    ["Q3/Q4 – Zahlen", "q3-q4-zahlen"],
    ["…", "deck"],
    ["", "deck"],
  ])("makes %j into %j", (title, slug) => {
    expect(slugOf(title)).toBe(slug);
  });
});

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

describeWithKit("packDeck and parsePackage", () => {
  it("packs the sample deck with its manifest", async () => {
    const source = await fixture("sample");
    const deck = packDeck(source);
    expect(deck).toMatchObject({ format: "lanfermann.deck", version: 1 });
    expect(deck.manifest).toEqual({
      title: "Der digitale Handschlag",
      slug: "der-digitale-handschlag",
      lang: "de",
      kit: kitVersion(),
      slides: 10,
      createdWith: `@lanfermann/slides ${version}`,
    });
    const text = source.files["deck.tsx"] ?? "";
    expect(deck.files).toEqual([
      {
        path: "deck.tsx",
        encoding: "utf8",
        sha256: sha(text),
        bytes: Buffer.byteLength(text),
        content: text,
      },
    ]);
  });

  it("packs pictures as base64, with every file in the order of its path", async () => {
    const deck = packDeck(await fixture("pictures"));
    expect(deck.files.map((file) => [file.path, file.encoding])).toEqual([
      ["bilder/punkt.png", "base64"],
      ["bilder/werkbank.svg", "base64"],
      ["deck.tsx", "utf8"],
      ["parts/werkbank.tsx", "utf8"],
    ]);
    expect(deck.files[0]?.bytes).toBe(69);
  });

  it("packs the same deck to the same bytes, whatever order its files were read in", async () => {
    const source = await fixture("pictures");
    const turned = {
      entry: source.entry,
      files: Object.fromEntries(Object.entries(source.files).reverse()),
      images: Object.fromEntries(Object.entries(source.images).reverse()),
    };
    const text = serializePackage(packDeck(source));
    expect(serializePackage(packDeck(turned))).toBe(text);
    expect(text.endsWith("\n")).toBe(true);
    // No time and no place of this machine.
    expect(text).not.toMatch(/20\d\d-\d\d-\d\dT|\/Users\/|fixtures/);
  });

  it("comes back as the same deck", async () => {
    const source = await fixture("pictures");
    const read = parsePackage(serializePackage(packDeck(source)));
    expect(read.entry).toBe("deck.tsx");
    expect(read.files).toEqual(source.files);
    expect(Object.keys(read.images).sort()).toEqual(Object.keys(source.images).sort());
    for (const [path, bytes] of Object.entries(source.images)) {
      expect(Buffer.from(read.images[path] ?? []).equals(Buffer.from(bytes))).toBe(true);
    }
    expect(read.manifest.slug).toBe("bilder-und-eigene-bauteile");
    // And packs to the same bytes again.
    const { manifest: _manifest, ...again } = read;
    expect(serializePackage(packDeck(again))).toBe(serializePackage(packDeck(source)));
  });

  it("takes another slug, and refuses one that is no slug", async () => {
    const source = await fixture("sample");
    expect(packDeck(source, { slug: "handschlag-2026" }).manifest.slug).toBe("handschlag-2026");
    expect(() => packDeck(source, { slug: "Hand Schlag" })).toThrow(PackageError);
    expect(() => packDeck(source, { slug: "../oben" })).toThrow(PackageError);
  });

  it("refuses a deck without a title", () => {
    const source = { ...deckWith("    <Slide />"), images: {} };
    source.files["deck.tsx"] = (source.files["deck.tsx"] ?? "").replace(' title="Probe"', "");
    expect(() => packDeck(source)).toThrow("no title");
  });
});

describeWithKit("parsePackage, on a package that is wrong", () => {
  const good = async (): Promise<DeckPackage> => packDeck(await fixture("pictures"));
  /** The package with one thing changed, as the text of its file. */
  const changed = async (change: (deck: DeckPackage) => unknown): Promise<string> => {
    const deck = structuredClone(await good());
    const replaced = change(deck);
    return JSON.stringify(replaced ?? deck);
  };
  const file = (deck: DeckPackage, index: number) => {
    const found = deck.files[index];
    if (!found) throw new Error("the fixture has fewer files");
    return found;
  };

  it("accepts the package as it was packed", async () => {
    expect(parsePackage(await changed(() => undefined)).manifest.slides).toBe(2);
  });

  it("refuses text that is no JSON", () => {
    expect(() => parsePackage("{")).toThrow(PackageError);
    expect(() => parsePackage("{")).toThrow("not JSON");
    expect(() => parsePackage("")).toThrow("not JSON");
  });

  it.each<[string, (deck: DeckPackage) => unknown, string]>([
    ["JSON that is a string", () => "{", "not a deck package"],
    ["JSON that is no object", () => [1, 2], "not a deck package"],
    ["another format", (deck) => ({ ...deck, format: "zip" }), "not a deck package"],
    ["a later version", (deck) => ({ ...deck, version: 2 }), "version this tool does not read"],
    ["no manifest", (deck) => ({ ...deck, manifest: undefined }), "no manifest"],
    ["an empty title", (deck) => void (deck.manifest.title = " "), "no title"],
    ["a slug with a slash", (deck) => void (deck.manifest.slug = "a/b"), "slug"],
    ["a slug that steps up", (deck) => void (deck.manifest.slug = ".."), "slug"],
    ["a language that is no tag", (deck) => void (deck.manifest.lang = "de DE"), "language tag"],
    ["no kit version", (deck) => void (deck.manifest.kit = ""), "kit's version"],
    ["half a slide", (deck) => void (deck.manifest.slides = 1.5), "whole number"],
    ["no list of files", (deck) => ({ ...deck, files: {} }), "no list of files"],
    [
      "a file that is no object",
      (deck) => void deck.files.push("x" as never),
      "files[4] is not a file",
    ],
    [
      "a path that steps up",
      (deck) => void (file(deck, 2).path = "../deck.tsx"),
      "files[2] has a path",
    ],
    [
      "a path in the middle that steps up",
      (deck) => void (file(deck, 3).path = "parts/../../x.tsx"),
      "files[3] has a path",
    ],
    [
      "an absolute path",
      (deck) => void (file(deck, 2).path = "/etc/deck.tsx"),
      "files[2] has a path",
    ],
    [
      "a path with a drive",
      (deck) => void (file(deck, 2).path = "C:/deck.tsx"),
      "files[2] has a path",
    ],
    [
      "a path with a backslash",
      (deck) => void (file(deck, 3).path = "parts\\werkbank.tsx"),
      "files[3] has a path",
    ],
    [
      "a path with a control character",
      (deck) => void (file(deck, 3).path = "parts/a\u0000.tsx"),
      "files[3] has a path",
    ],
    [
      "a path named twice",
      (deck) => void (file(deck, 3).path = "deck.tsx"),
      "files[3] names a path a second time",
    ],
    [
      "a file of another kind",
      (deck) => void (file(deck, 3).path = "parts/skript.js"),
      "files[3] is of a kind",
    ],
    [
      "code as base64",
      (deck) => void (file(deck, 2).encoding = "base64"),
      "files[2] is not encoded",
    ],
    [
      "a picture as text",
      (deck) => void (file(deck, 0).encoding = "utf8"),
      "files[0] is not encoded",
    ],
    [
      "base64 that is none",
      (deck) => void (file(deck, 0).content = "nicht*base64"),
      "files[0] is not encoded",
    ],
    ["a wrong size", (deck) => void (file(deck, 2).bytes += 1), "files[2] is not of the size"],
    [
      "a changed content",
      (deck) => void (file(deck, 2).content += " "),
      "files[2] is not of the size",
    ],
    [
      "a content of the same size and another hash",
      (deck) => void (file(deck, 2).content = file(deck, 2).content.replace("Bilder", "Bilden")),
      "files[2] does not match its hash",
    ],
    [
      "a missing hash",
      (deck) => void delete (file(deck, 2) as Partial<DeckPackage["files"][number]>).sha256,
      "files[2] lacks",
    ],
    ["no deck.tsx", (deck) => void deck.files.splice(2, 1), "no deck.tsx"],
  ])("refuses %s", async (_name, change, message) => {
    const json = await changed(change);
    expect(() => parsePackage(json)).toThrow(PackageError);
    expect(() => parsePackage(json)).toThrow(message);
  });

  it("refuses a picture that is too heavy, although its size and hash are right", async () => {
    const heavy = Buffer.alloc(MAX_IMAGE_BYTES + 1);
    const json = await changed((deck) => {
      Object.assign(file(deck, 0), {
        content: heavy.toString("base64"),
        bytes: heavy.byteLength,
        sha256: createHash("sha256").update(heavy).digest("hex"),
      });
    });
    expect(() => parsePackage(json)).toThrow("files[0] is too heavy");
  });

  it("never repeats text of the package in its message", async () => {
    const json = await changed(
      (deck) => void (file(deck, 3).path = "../../geheim/\u001b[31mrot.tsx"),
    );
    try {
      parsePackage(json);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PackageError);
      expect(String(error)).not.toContain("geheim");
      expect(String(error)).not.toContain("\u001b");
    }
  });
});
