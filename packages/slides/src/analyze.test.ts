import { describe, expect, it } from "vitest";

import { analyzeDeck, type AnalyzeInput } from "./analyze";
import { MAX_DECK_IMAGE_BYTES, MAX_IMAGE_BYTES } from "./source";
import { deckOf, deckWith, fixture, HEAD } from "./testing";
import { formatDiagnostic } from "./types";

const codes = (source: AnalyzeInput, classes?: string[]) =>
  analyzeDeck(source, classes ? { classes } : {}).diagnostics.map((diagnostic) => diagnostic.code);
const lines = (source: AnalyzeInput, classes?: string[]) =>
  analyzeDeck(source, classes ? { classes } : {}).diagnostics.map(formatDiagnostic);

const SLIDE = '    <Slide id="eins"><Title>Eine Folie.</Title></Slide>';

describe("what a deck may import", () => {
  it("takes React, the kit and its own files", () => {
    const source = deckOf(
      `import { Fragment } from "react";\n${HEAD}import { Teil } from "./parts/teil";\nimport bild from "./bild.png";\n` +
        'export default (<Deck title="Probe"><Fragment><Teil src={bild} /></Fragment></Deck>);\n',
      {
        "parts/teil.tsx": `${HEAD}export function Teil({ src }: { src: string }) { return <Slide><Title>{src}</Title></Slide>; }\n`,
      },
    );
    expect(lines({ ...source, images: { "bild.png": new Uint8Array(4) } })).toEqual([]);
  });

  it("names the place of an import from another package", async () => {
    expect(lines(await fixture("bad-import"))).toEqual([
      'deck.tsx:2:20 error import "lodash" is not allowed (import-not-allowed)',
    ]);
  });

  it.each([
    ['import fs from "node:fs";', "node:fs"],
    ['import x from "https://example.com/x.js";', "https://example.com/x.js"],
    ['import x from "/etc/passwd";', "/etc/passwd"],
    ['import x from "@lanfermann/ui";', "@lanfermann/ui"],
    ['export { x } from "lodash";', "lodash"],
    ['type T = import("lodash").T;', "lodash"],
  ])("refuses %s", (line, name) => {
    const found = analyzeDeck(deckOf(`${HEAD}${line}\nexport default (<Deck title="Probe" />);\n`));
    expect(found.diagnostics.map((diagnostic) => diagnostic.message)).toContain(
      `import ${JSON.stringify(name)} is not allowed`,
    );
  });

  it("refuses a relative path that leaves the folder", () => {
    const source = deckWith(SLIDE, 'import { x } from "../geheim";');
    expect(lines(source)).toEqual([
      'deck.tsx:2:19 error import "../geheim" leaves the deck\'s folder (import-outside-deck)',
    ]);
  });

  it("says when a relative import names no file", () => {
    expect(codes(deckWith(SLIDE, 'import { x } from "./fehlt";'))).toEqual(["import-not-found"]);
  });

  it("knows a picture is missing only when it is given the pictures", () => {
    const source = deckWith(SLIDE, 'import bild from "./bild.png";');
    expect(codes(source)).toEqual([]);
    expect(codes({ ...source, images: {} })).toEqual(["import-not-found"]);
  });

  it("refuses an import of a file that is neither code nor a picture", () => {
    expect(codes(deckWith(SLIDE, 'import "./druck.css";'))).toEqual(["unsupported-file"]);
  });

  it("refuses import() and require", () => {
    const source = deckWith(
      SLIDE,
      'const a = import("./x");\nconst b = require("y");\nimport c = require("z");',
    );
    expect(codes(source)).toEqual(["dynamic-import", "require", "require"]);
  });
});

describe("names a deck may not use", () => {
  it.each([
    ["fetch('/x');", "fetch"],
    ["new XMLHttpRequest();", "XMLHttpRequest"],
    ["new WebSocket('wss://x');", "WebSocket"],
    ["eval('1');", "eval"],
    ["window.fetch('/x');", "fetch"],
    ["globalThis['eval']('1');", "eval"],
    ["const load = fetch;", "fetch"],
  ])("reports %s", (line, name) => {
    const found = analyzeDeck(deckWith(SLIDE, line)).diagnostics;
    expect(found.map((diagnostic) => diagnostic.code)).toEqual(["forbidden-global"]);
    expect(found[0]?.message).toContain(JSON.stringify(name));
  });

  it("reports new Function, called or constructed", () => {
    expect(codes(deckWith(SLIDE, 'new Function("return 1");\nFunction("return 2");'))).toEqual([
      "forbidden-global",
      "forbidden-global",
    ]);
  });

  it("leaves a property, a key and a type of the same name alone", () => {
    const source = deckWith(
      SLIDE,
      "const api = { fetch: 1, eval() { return 2; } };\napi.fetch;\nlet socket: WebSocket | undefined;\ntype F = typeof Function;",
    );
    expect(codes(source)).toEqual([]);
  });
});

describe("the default export", () => {
  it("is missing when there is no deck.tsx", () => {
    expect(lines({ entry: "deck.tsx", files: {} })).toEqual([
      "deck.tsx:1:1 error deck.tsx is missing: a deck is a folder with a deck.tsx whose default export is a <Deck> element (no-default-deck)",
    ]);
  });

  it("is missing when the file exports nothing by default", () => {
    expect(codes(deckOf(`${HEAD}export const deck = <Deck title="Probe" />;\n`))).toEqual([
      "no-default-deck",
    ]);
  });

  it("has to be a <Deck> element of the kit", () => {
    expect(codes(deckOf(`${HEAD}export default <Slide />;\n`))).toEqual(["no-default-deck"]);
    expect(
      codes(deckOf(`${HEAD}export default function Folien() { return <Deck title="x" />; }\n`)),
    ).toEqual(["no-default-deck"]);
    // A part of the deck's own that happens to be called Deck is not the kit's.
    expect(codes(deckOf("function Deck() { return null; }\nexport default <Deck />;\n"))).toEqual([
      "no-default-deck",
    ]);
  });

  it("may go through one const, brackets, a type and another name for Deck", () => {
    const direct = deckOf(
      `${HEAD}const deck = (<Deck title="Probe">\n${SLIDE}\n</Deck>);\nexport default deck;\n`,
    );
    expect(analyzeDeck(direct)).toMatchObject({ title: "Probe", diagnostics: [] });
    const named = deckOf(
      `import * as S from "@lanfermann/ui/slides";\nconst deck = (<S.Deck title="Probe" />) satisfies object;\nexport { deck as default };\n`,
    );
    expect(analyzeDeck(named)).toMatchObject({ title: "Probe", diagnostics: [] });
    const renamed = deckOf(
      `import { Deck as Folien } from "@lanfermann/ui/slides";\nexport default <Folien title="Probe" />;\n`,
    );
    expect(analyzeDeck(renamed).diagnostics).toEqual([]);
  });
});

describe("the deck's title, language and slides", () => {
  it("reads the sample deck", async () => {
    const analysis = analyzeDeck(await fixture("sample"));
    expect(analysis.diagnostics).toEqual([]);
    expect(analysis.title).toBe("Der digitale Handschlag");
    expect(analysis.lang).toBeUndefined();
    expect(analysis.slides).toHaveLength(10);
    expect(analysis.slides.map((slide) => slide.id)).toEqual([
      "cover",
      "recherche",
      "erster-eindruck",
      "vertrauen",
      "befunde",
      "einwaende",
      "leistungen",
      "ablauf",
      "angebote",
      "analyse",
    ]);
    expect(analysis.slides.every((slide) => slide.hasNotes)).toBe(true);
    expect(analysis.slides[0]).toMatchObject({ index: 0, line: 30, column: 5 });
  });

  it("reads a title with markup as its words", () => {
    const source = deckOf(
      `${HEAD}export default (<Deck lang="en-GB" title={<>Fragen &amp;<br />Antworten</>} />);\n`,
    );
    expect(analyzeDeck(source)).toMatchObject({ title: "Fragen & Antworten", lang: "en-GB" });
  });

  it("refuses a title or a language that is computed, and a spread on Deck", () => {
    const source = deckOf(
      `${HEAD}const t = "x";\nconst p = {};\nexport default (<Deck title={t} lang="not a tag" {...p} />);\n`,
    );
    expect(codes(source).filter((code) => code === "deck-prop-not-literal")).toHaveLength(3);
  });

  it("opens fragments and counts each child as one slide", () => {
    const source = deckOf(
      `import { Fragment } from "react";\n${HEAD}export default (\n  <Deck title="Probe">\n    <>\n${SLIDE}\n    </>\n    {/* ein Kommentar */}\n    <Fragment key="a">\n${SLIDE}\n    </Fragment>\n    <div />\n  </Deck>\n);\n`,
    );
    const analysis = analyzeDeck(source);
    expect(analysis.diagnostics).toEqual([]);
    expect(analysis.slides.map((slide) => slide.line)).toEqual([6, 10, 12]);
  });

  it("refuses slides that are computed", () => {
    const source = deckWith("    {[1, 2].map((n) => <Slide key={n} />)}");
    expect(codes(source)).toEqual(["slides-not-static"]);
  });
});

describe("notes", () => {
  it("reports what a build for an audience could not leave out", async () => {
    expect(lines(await fixture("notes-forms"))).toEqual([
      "deck.tsx:11:20 warning notes are read from the children of <Deck> only: these are never shown (a build for an audience leaves them out all the same) (notes-ignored)",
      "deck.tsx:25:26 error notes have to be written out where they stand (a string, or plain markup): a variable would leave its text in a file for the audience (notes-not-literal)",
      "deck.tsx:28:26 error a spread of an object that is not written out here could carry notes: write the props out (spread-on-slide)",
    ]);
  });

  it("reports a property named notes", () => {
    expect(codes(deckWith(SLIDE, 'const folie = { notes: "Geheim, nur für mich." };'))).toEqual([
      "notes-property",
    ]);
  });
});

describe("classes", () => {
  const classes = ["flex", "gap-8", "text-fg"];

  it("are not looked at without the kit's vocabulary", () => {
    expect(codes(deckWith('    <Slide className="erfunden" />'))).toEqual([]);
  });

  it("reports each class the kit does not have, at its own place", () => {
    const source = deckWith('    <Slide className="flex erfunden gap-8 p-[3px]" />');
    expect(lines(source, classes)).toEqual([
      'deck.tsx:5:28 error class "erfunden" is not one of the kit\'s: it has no style in the built file (unknown-class)',
      'deck.tsx:5:43 error class "p-[3px]" is not one of the kit\'s: it has no style in the built file (unknown-class)',
    ]);
  });

  it("reads a string in braces and a template without placeholders", () => {
    const source = deckWith(
      '    <Slide className={"flex"} />\n    <Slide className={`text-fg nope`} />',
    );
    expect(codes(source, classes)).toEqual(["unknown-class"]);
  });

  it("warns where a className is computed", () => {
    const source = deckWith('    <Slide className={["flex"].join(" ")} />');
    const found = analyzeDeck(source, { classes }).diagnostics;
    expect(found).toMatchObject([{ code: "class-not-checked", severity: "warning" }]);
  });
});

describe("files", () => {
  it("reports a file a deck cannot hold", () => {
    const source = { ...deckWith(SLIDE), images: { "daten.json": new Uint8Array(1) } };
    source.files["skript.js"] = "export {};";
    source.files["../oben.ts"] = "export {};";
    expect(codes(source)).toEqual(["unsupported-file", "unsupported-file", "unsupported-file"]);
  });

  it("reports a picture that is too heavy, and pictures that are too heavy together", () => {
    const heavy = {
      ...deckWith(SLIDE),
      images: { "gross.png": new Uint8Array(MAX_IMAGE_BYTES + 1) },
    };
    expect(lines(heavy)).toEqual([
      'gross.png:1:1 error "gross.png" weighs 2.0 MB: a picture may weigh 2.0 MB, because it becomes part of the one file (asset-too-large)',
    ]);
    const images: Record<string, Uint8Array> = {};
    for (let index = 0; index < 7; index += 1) {
      images[`bild-${index}.png`] = new Uint8Array(MAX_IMAGE_BYTES);
    }
    expect(7 * MAX_IMAGE_BYTES).toBeGreaterThan(MAX_DECK_IMAGE_BYTES);
    expect(lines({ ...deckWith(SLIDE), images })).toEqual([
      "deck.tsx:1:1 error the deck's pictures weigh 14.0 MB together: 12.0 MB is the most a deck may carry (asset-too-large)",
    ]);
  });
});
