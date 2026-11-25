import { expect, it } from "vitest";

import { deckOf, deckWith, describeWithKit, fixture, HEAD } from "./testing";
import { typecheckDeck } from "./typecheck";

describeWithKit("typecheckDeck", () => {
  it.each(["sample", "pictures", "broken", "notes-forms"])(
    "finds nothing in the %s fixture",
    async (name) => {
      expect(await typecheckDeck(await fixture(name))).toEqual([]);
    },
  );

  it("checks a prop against the kit's declarations", async () => {
    const errors = await typecheckDeck(
      deckWith('    <Slide ground="grün"><Title>Eine Folie.</Title></Slide>'),
    );
    expect(errors).toEqual([
      {
        kind: "type",
        code: "ts2322",
        file: "deck.tsx",
        line: 5,
        column: 12,
        message: expect.stringContaining('"grün"') as string,
      },
    ]);
  });

  it("knows a part the kit does not have, and a prop that is missing", async () => {
    const errors = await typecheckDeck(
      deckOf(
        'import { Deck, Folie } from "@lanfermann/ui/slides";\nexport default (<Deck><Folie /></Deck>);\n',
      ),
    );
    expect(errors.map((error) => error.code)).toEqual(["ts2305", "ts2741"]);
    expect(errors.every((error) => error.kind === "type")).toBe(true);
  });

  it("is strict", async () => {
    const errors = await typecheckDeck(
      deckWith("    <Slide />", "function laut(text) { return text.toUpperCase(); }\nlaut(1);"),
    );
    expect(errors).toMatchObject([{ code: "ts7006", line: 2 }]);
  });

  it("marks code that does not parse as a syntax error", async () => {
    const errors = await typecheckDeck(deckOf(`${HEAD}export default (<Deck title="Probe">\n`));
    const syntax = errors.filter((error) => error.kind === "syntax");
    expect(syntax.length).toBeGreaterThan(0);
    expect(syntax.every((error) => /^ts\d+$/.test(error.code ?? ""))).toBe(true);
    expect(syntax[0]).toMatchObject({ file: "deck.tsx" });
  });

  it("resolves the deck's own files, and gives a picture's import the type of its name", async () => {
    const source = deckWith(
      "    <Slide><Title>{bild.toUpperCase() + zahl.toFixed(1)}</Title></Slide>",
      'import bild from "./bilder/bild.webp";\nimport { zahl } from "./parts/zahl";',
    );
    source.files["parts/zahl.ts"] = "export const zahl: number = 3;\n";
    expect(await typecheckDeck(source)).toEqual([]);
    source.files["parts/zahl.ts"] = 'export const zahl: string = "drei";\n';
    // 'toFixed' does not exist on type 'string'.
    expect(await typecheckDeck(source)).toMatchObject([
      { kind: "type", code: "ts2551", file: "deck.tsx", line: 6 },
    ]);
  });

  it("resolves nothing but React, the kit and the deck", async () => {
    // TypeScript and esbuild are installed right beside this tool, and Node's types too.
    const source = deckWith(
      "    <Slide />",
      'import ts from "typescript";\nimport { build } from "esbuild";\nimport { readFileSync } from "node:fs";\nimport up from "../../package.json";\nconsole.log(ts, build, readFileSync, up, process.env);',
    );
    const errors = await typecheckDeck(source);
    expect(errors.map((error) => [error.code, error.line])).toEqual([
      ["ts2307", 2],
      ["ts2307", 3],
      // "Cannot find name 'node:fs'": Node's types are not there for a deck, nor is `process`.
      ["ts2591", 4],
      ["ts2307", 5],
      ["ts2591", 6],
    ]);
  });

  it("takes a deck whose entry has another name", async () => {
    const errors = await typecheckDeck({
      entry: "folien.tsx",
      files: {
        "folien.tsx": `${HEAD}export default (<Deck title="Probe" lang={5}><Slide /></Deck>);\n`,
      },
    });
    expect(errors).toMatchObject([{ kind: "type", code: "ts2322", file: "folien.tsx", line: 2 }]);
  });
});
