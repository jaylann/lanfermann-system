import { runInNewContext } from "node:vm";

import { expect, it } from "vitest";

import { bundleDeck } from "./bundle";
import { kitVersion } from "./kit";
import { deckOf, deckWith, describeWithKit, fixture, HEAD } from "./testing";

const SLIDE = '    <Slide id="eins"><Title>Eine Folie.</Title></Slide>';

describeWithKit("bundleDeck", () => {
  it("compiles the sample deck to one script for the player's globals", async () => {
    const { files, entry } = await fixture("sample");
    const result = await bundleDeck({ files, entry });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.kitVersion).toBe(kitVersion());
    expect(result.kitVersion).toMatch(/^\d+\.\d+\.\d+/);
    const js = result.js ?? "";
    expect(js.startsWith("var __LF_DECK__=")).toBe(true);
    expect(js).toContain("globalThis.__LF_SLIDES__.slides");
    expect(js).toContain("globalThis.__LF_SLIDES__.jsxRuntime");
    // Nothing of React or of the kit is inside: they are the player's.
    expect(js.length).toBeLessThan(20_000);
    // Text stands as it is written, umlauts and all.
    expect(js).toContain("Begrüßung.");
  });

  it("evaluates to the deck element, with React taken from the player", async () => {
    const result = await bundleDeck(
      deckOf(
        `import { Fragment } from "react";\n${HEAD}export default (<Deck title="Probe"><Fragment><Slide id="a" /></Fragment></Deck>);\n`,
      ),
    );
    const calls: unknown[][] = [];
    const jsx = (...args: unknown[]) => {
      calls.push(args);
      return { args };
    };
    // The script is a classic one: it reads the player from the page's globals and leaves one.
    const page: Record<string, unknown> = {
      __LF_SLIDES__: {
        React: { Fragment: "fragment" },
        jsxRuntime: { jsx, jsxs: jsx },
        slides: { Deck: "deck", Slide: "slide" },
      },
    };
    runInNewContext(result.js ?? "", page);
    expect(page.__LF_DECK__).toMatchObject({ default: { args: ["deck", { title: "Probe" }] } });
    expect(calls.map((call) => call[0])).toEqual(["slide", "fragment", "deck"]);
  });

  it("reports an import outside the allowlist as data, with its place", async () => {
    const { files, entry } = await fixture("bad-import");
    const result = await bundleDeck({ files, entry });
    expect(result).toEqual({
      ok: false,
      kitVersion: kitVersion(),
      errors: [
        {
          kind: "import",
          code: "import-not-allowed",
          file: "deck.tsx",
          line: 2,
          column: 20,
          message: 'import "lodash" is not allowed',
        },
      ],
    });
    expect("js" in result).toBe(false);
  });

  it.each([
    ['import fs from "node:fs";', "import-not-allowed"],
    ['import x from "https://example.com/x.js";', "import-not-allowed"],
    ['import x from "react-dom";', "import-not-allowed"],
    ['import x from "@lanfermann/ui";', "import-not-allowed"],
    ['import x from "../oben";', "import-outside-deck"],
    ['import x from "./fehlt";', "import-not-found"],
    ['import x from "./druck.css";', "unsupported-file"],
    ['const x = import("./teil");', "dynamic-import"],
    ['const x = require("./teil");', "require"],
  ])("refuses %s although no static check ran", async (line, code) => {
    const result = await bundleDeck(deckWith(SLIDE, `${line}\nconsole.log(x);`));
    expect(result.ok).toBe(false);
    expect(result.js).toBeUndefined();
    expect(result.errors).toMatchObject([{ kind: "import", code, file: "deck.tsx", line: 2 }]);
  });

  it("refuses a forbidden import in a file of the deck that only another file imports", async () => {
    const result = await bundleDeck(
      deckWith(SLIDE, 'import { teil } from "./parts/teil";\nconsole.log(teil);'),
    );
    expect(result.errors).toMatchObject([{ code: "import-not-found" }]);
    const nested = deckWith(SLIDE, 'import { teil } from "./parts/teil";\nconsole.log(teil);');
    nested.files["parts/teil.ts"] = 'import os from "node:os";\nexport const teil = os;\n';
    expect((await bundleDeck(nested)).errors).toMatchObject([
      { kind: "import", code: "import-not-allowed", file: "parts/teil.ts", line: 1, column: 16 },
    ]);
  });

  it("reports code that does not parse as a syntax error, not a throw", async () => {
    const result = await bundleDeck(deckOf(`${HEAD}export default (<Deck title="Probe">\n`));
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatchObject({ kind: "syntax", code: "bundle", file: "deck.tsx" });
  });

  it("reports a missing entry", async () => {
    const result = await bundleDeck({ files: {}, entry: "deck.tsx" });
    expect(result).toMatchObject({
      ok: false,
      errors: [{ kind: "import", code: "no-default-deck", file: "deck.tsx" }],
    });
  });

  it("resolves a module without its extension, an index file and a file in a folder", async () => {
    const source = deckWith(
      SLIDE,
      'import { a } from "./eins";\nimport { b } from "./zwei";\nimport { c } from "./drei/teil.tsx";\nconsole.log(a, b, c);',
    );
    source.files["eins.ts"] = 'export const a = "aus eins";';
    source.files["zwei/index.tsx"] = 'export const b = "aus zwei";';
    source.files["drei/teil.tsx"] =
      'import { a } from "../eins";\nexport const c = a + " über drei";';
    const result = await bundleDeck(source);
    expect(result.errors).toEqual([]);
    expect(result.js).toContain("aus eins");
    expect(result.js).toContain("aus zwei");
  });

  it("names a picture by its path from the deck's folder, wherever it is imported", async () => {
    const { files, entry } = await fixture("pictures");
    const result = await bundleDeck({ files, entry });
    expect(result.errors).toEqual([]);
    expect(result.js).toContain('"./bilder/punkt.png"');
    // Imported as ../bilder/werkbank.svg from parts/: the name is the same from everywhere.
    expect(result.js).toContain('"./bilder/werkbank.svg"');
    expect(result.js).not.toContain("data:image");
  });
});

describeWithKit("bundleDeck with stripNotes", () => {
  it("leaves the notes of the sample deck out, and only then", async () => {
    const { files, entry } = await fixture("sample");
    const presenter = await bundleDeck({ files, entry });
    const audience = await bundleDeck({ files, entry, stripNotes: true });
    expect(audience.errors).toEqual([]);
    expect(presenter.js).toContain("NOTE-CANARY-7f3a91");
    expect(presenter.js).toContain("notes:");
    expect(audience.js).not.toContain("NOTE-CANARY");
    expect(audience.js).not.toContain("notes");
    expect(audience.js).not.toContain("Langsam sprechen");
    // The slides themselves are all there.
    expect(audience.js).toContain("Vertrauen entsteht,");
    expect((audience.js ?? "").length).toBeLessThan((presenter.js ?? "").length);
  });

  it("takes notes out of every file and off a part of the deck's own", async () => {
    const source = deckOf(
      `${HEAD}import { Eigene } from "./parts/eigene";\nexport default (\n  <Deck title="Probe">\n    <Eigene id="a" notes="CANARY-AN-DER-VERWENDUNG steht am eigenen Bauteil." />\n    <Slide notes={<>CANARY-IM-MARKUP mit <b>Auszeichnung</b> darin.</>} />\n  </Deck>\n);\n`,
      {
        "parts/eigene.tsx": `${HEAD}export function Eigene({ id }: { id: string; notes?: string }) {\n  return <Slide id={id} notes="CANARY-IM-BAUTEIL liest kein Player."><Title>Eigene</Title></Slide>;\n}\n`,
      },
    );
    const presenter = await bundleDeck(source);
    const audience = await bundleDeck({ ...source, stripNotes: true });
    for (const canary of ["CANARY-AN-DER-VERWENDUNG", "CANARY-IM-MARKUP", "CANARY-IM-BAUTEIL"]) {
      expect(presenter.js).toContain(canary);
      expect(audience.js).not.toContain(canary);
    }
    expect(audience.ok).toBe(true);
    expect(audience.js).not.toContain("Auszeichnung");
  });

  it.each([
    [
      "a variable",
      'const spoken = "CANARY in einer Konstante.";',
      "notes={spoken}",
      "notes-not-literal",
    ],
    ["a spread", 'const more = { ground: "ink" as const };', "{...more}", "spread-on-slide"],
    ["a property", 'const more = { notes: "CANARY in einer Eigenschaft." };', "", "notes-property"],
  ])("fails closed on %s, and hands out no script", async (_name, before, attribute, code) => {
    const source = deckWith(`    <Slide ${attribute} />`, before);
    const result = await bundleDeck({ ...source, stripNotes: true });
    expect(result.ok).toBe(false);
    expect(result.js).toBeUndefined();
    expect(result.errors).toMatchObject([{ kind: "notes", code }]);
    // A presenter's file may hold all of it.
    expect((await bundleDeck(source)).ok).toBe(true);
  });

  it("fails the notes-forms fixture for an audience, and builds it for a presenter", async () => {
    const { files, entry } = await fixture("notes-forms");
    const audience = await bundleDeck({ files, entry, stripNotes: true });
    expect(audience.ok).toBe(false);
    expect(audience.js).toBeUndefined();
    expect(audience.errors.map((error) => [error.kind, error.code, error.line])).toEqual([
      ["notes", "notes-not-literal", 25],
      ["notes", "spread-on-slide", 28],
    ]);
    const presenter = await bundleDeck({ files, entry });
    expect(presenter.ok).toBe(true);
    expect(presenter.js).toContain("NOTE-CANARY-NESTED");
  });

  it("is not ok when words of the notes also stand on a slide", async () => {
    const source = deckWith(
      '    <Slide notes="Vertrauen entsteht, bevor das Telefon klingelt."><Title>Vertrauen entsteht, bevor das Telefon klingelt.</Title></Slide>',
    );
    const result = await bundleDeck({ ...source, stripNotes: true });
    expect(result.ok).toBe(false);
    expect(result.js).toBeUndefined();
    expect(result.errors).toMatchObject([
      { kind: "notes", code: "notes-in-audience-build", file: "deck.tsx", line: 5 },
    ]);
  });

  it("finds a leak although the script writes the text differently", async () => {
    // In the script the quote is escaped and the line break is \n: the pieces are still found.
    const source = deckWith(
      '    <Slide notes={`Erst die "große Zahl" nennen,\ndann zwei Sekunden warten.`}><Title>{"dann zwei Sekunden warten."}</Title></Slide>',
    );
    const result = await bundleDeck({ ...source, stripNotes: true });
    expect(result.errors).toMatchObject([{ code: "notes-in-audience-build" }]);
  });

  it("reports notes and imports together", async () => {
    const source = deckWith("    <Slide notes={spoken} />", 'import spoken from "lodash";');
    const result = await bundleDeck({ ...source, stripNotes: true });
    expect(result.errors.map((error) => error.kind).sort()).toEqual(["import", "notes"]);
  });
});
