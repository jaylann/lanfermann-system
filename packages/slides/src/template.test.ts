import { describe, expect, it } from "vitest";

import { analyzeDeck } from "./analyze";
import { bundleDeck } from "./bundle";
import { loadKit } from "./kit";
import { packDeck, parsePackage, serializePackage } from "./pack";
import { deckTemplate, TemplateError } from "./template";
import { describeWithKit } from "./testing";
import { typecheckDeck } from "./typecheck";

describe("deckTemplate", () => {
  it("writes a deck.tsx and a file in each of parts/, data/ and images/", () => {
    const source = deckTemplate("blank", { title: "Untitled deck" });
    expect(source.entry).toBe("deck.tsx");
    expect(Object.keys(source.files).sort()).toEqual([
      "data/index.ts",
      "deck.tsx",
      "images/index.ts",
      "parts/index.ts",
    ]);
    expect(source.images).toEqual({});
    for (const [path, text] of Object.entries(source.files)) {
      if (path !== "deck.tsx") expect(text).toMatch(/^\/\/ .+\nexport \{\};\n$/s);
    }
  });

  it("is a cover and a closing slide, each with an id and notes, in English", () => {
    const analysis = analyzeDeck(deckTemplate("blank", { title: "Untitled deck" }));
    expect(analysis.title).toBe("Untitled deck");
    expect(analysis.lang).toBe("en");
    expect(analysis.slides.map((slide) => [slide.id, slide.hasNotes])).toEqual([
      ["cover", true],
      ["closing", true],
    ]);
  });

  it("takes the title and the language it is given", () => {
    const source = deckTemplate("blank", { title: "  Quarterly\n  review ", lang: "de-CH" });
    const analysis = analyzeDeck(source);
    expect(analysis.title).toBe("Quarterly review");
    expect(analysis.lang).toBe("de-CH");
    expect(source.files["deck.tsx"]).toContain('title="Quarterly review"');
  });

  it("writes a title with quotes, an ampersand or a backslash so that it reads back the same", () => {
    const title = 'Q&A: "Why" \\ how &amp; when';
    const source = deckTemplate("blank", { title });
    expect(analyzeDeck(source).title).toBe(title);
    expect(analyzeDeck(source).diagnostics).toEqual([]);
  });

  it.each<[string, Parameters<typeof deckTemplate>[1], string]>([
    ["an empty title", { title: "" }, "needs a title"],
    ["a title of white space", { title: " \n\t " }, "needs a title"],
    ["a title with a control character", { title: "Ring\u0007" }, "control character"],
    ["a language that is no tag", { title: "Deck", lang: "en GB" }, "language"],
    ["a language that is empty", { title: "Deck", lang: "" }, "language"],
  ])("refuses %s", (_name, options, message) => {
    expect(() => deckTemplate("blank", options)).toThrow(TemplateError);
    expect(() => deckTemplate("blank", options)).toThrow(message);
  });

  it("refuses a name that is no template", () => {
    // As a caller in plain JavaScript would: the types do not let the name through.
    const call = (): void => {
      Reflect.apply(deckTemplate, undefined, ["fancy", { title: "Deck" }]);
    };
    expect(call).toThrow(TemplateError);
    expect(call).toThrow("The templates are blank.");
  });
});

describeWithKit("deckTemplate, against the kit", () => {
  const source = deckTemplate("blank", { title: "Untitled deck" });

  it("passes the static check with the kit's classes", () => {
    expect(analyzeDeck(source, { classes: loadKit().classes }).diagnostics).toEqual([]);
  });

  it("passes the type check", async () => {
    expect(await typecheckDeck(source)).toEqual([]);
    const quoted = deckTemplate("blank", { title: 'Q&A: "Why"', lang: "de" });
    expect(await typecheckDeck(quoted)).toEqual([]);
  });

  it("bundles for an audience, with no word of its notes left in the script", async () => {
    const bundle = await bundleDeck({ ...source, stripNotes: true });
    expect(bundle.errors).toEqual([]);
    expect(bundle.ok).toBe(true);
    expect(bundle.js).not.toContain("stop talking");
    expect(bundle.js).toContain("The next step.");
  });

  it("packs, and comes back from its package as the same files", () => {
    const deck = packDeck(source);
    expect(deck.manifest).toMatchObject({ title: "Untitled deck", slug: "untitled-deck" });
    expect(deck.manifest).toMatchObject({ lang: "en", slides: 2 });
    expect(deck.files.map((file) => file.path)).toEqual([
      "data/index.ts",
      "deck.tsx",
      "images/index.ts",
      "parts/index.ts",
    ]);
    expect(parsePackage(serializePackage(deck)).files).toEqual(source.files);
  });
});
