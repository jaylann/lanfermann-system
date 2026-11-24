import { describe, expect, it } from "vitest";

import { parseDeck } from "./analyze";
import { blankNotes, findLeaks, MIN_NEEDLE, needlesOf, scanNotes } from "./notes";
import { deckOf, deckWith } from "./testing";

const scan = (files: Record<string, string>) => scanNotes(parseDeck(files));
const codesOf = (files: Record<string, string>) => scan(files).errors.map((error) => error.code);

describe("scanNotes", () => {
  it("finds notes in every form that is written out", () => {
    const { files } = deckWith(
      [
        '    <Slide notes="Als Wort, einfach so." />',
        "    <Slide notes={`Als Vorlage ohne Platzhalter.`} />",
        '    <Slide notes={"In Klammern geschrieben."} />',
        '    <Slide notes={<>Erst <b>das</b>, dann <em title="Wichtig">das andere</em>.<br /></>} />',
        "    <Slide notes />",
        "    <Slide notes={null} />",
      ].join("\n"),
    );
    const found = scan(files);
    expect(found.errors).toEqual([]);
    expect(found.attributes.map((attribute) => attribute.texts)).toEqual([
      ["Als Wort, einfach so."],
      ["Als Vorlage ohne Platzhalter."],
      ["In Klammern geschrieben."],
      ["Erst ", "das", ", dann ", "Wichtig", "das andere", "."],
      [],
      [],
    ]);
    expect(found.attributes[0]).toMatchObject({ file: "deck.tsx", line: 5, column: 12 });
  });

  it.each([
    ["a variable", "notes={spoken}"],
    ["a property of an object", "notes={texte.erste}"],
    ["a template with a placeholder", "notes={`Zahl: ${1}`}"],
    ["joined strings", 'notes={"a" + "b"}'],
    ["a call", "notes={sagen()}"],
    ["markup with a variable inside", "notes={<>{spoken}</>}"],
    ["a part of the deck's own", "notes={<Hinweis />}"],
    ["markup with a spread", "notes={<p {...rest}>Text</p>}"],
  ])("refuses %s", (_name, attribute) => {
    const { files } = deckWith(`    <Slide ${attribute} />`);
    expect(codesOf(files)).toContain("notes-not-literal");
  });

  it("finds notes on a part of the deck's own, in any file", () => {
    const { files } = deckOf('export default <Eigenes notes="Auch hier wird es entfernt." />;\n', {
      "parts/eins.tsx": 'export const eins = <section notes="In einer anderen Datei." />;\n',
    });
    expect(scan(files).attributes.map((attribute) => attribute.file)).toEqual([
      "deck.tsx",
      "parts/eins.tsx",
    ]);
  });

  it("allows a spread of what is written out, and of a part's own props", () => {
    const { files } = deckWith(
      '    <Slide {...{ ground: "tint", "data-x": 1 }} />',
      [
        "function Eigene(props: { id: string }) { return <Slide {...props} />; }",
        "function Andere({ id, ...rest }: { id: string }) { return <Slide id={id} {...rest} />; }",
        "const Dritte = ({ slide }: { slide: object }) => <Slide {...slide} />;",
      ].join("\n"),
    );
    expect(codesOf(files)).toEqual([]);
  });

  it.each([
    ["a const of the file", "const p = { id: 'x' };", "{...p}"],
    ["a call", "const make = () => ({});", "{...make()}"],
    ["a property", "const all = { one: {} };", "{...all.one}"],
    ["an object with a spread inside", "const p = {};", "{...{ ...p }}"],
    ["an object with a computed key", "const k = 'notes';", "{...{ [k]: 'x' }}"],
  ])("refuses a spread of %s", (_name, before, spread) => {
    const { files } = deckWith(`    <Slide ${spread} />`, before);
    expect(codesOf(files)).toContain("spread-on-slide");
  });

  it("refuses a property named notes, however its key is written", () => {
    const { files } = deckWith(
      "    <Slide />",
      [
        'const a = { notes: "eins" };',
        'const b = { "notes": "zwei" };',
        'const c = { ["notes"]: "drei" };',
        "const notes = 1;",
        "const d = { notes };",
        "const e = { notes() { return 1; } };",
      ].join("\n"),
    );
    expect(codesOf(files)).toEqual([
      "notes-property",
      "notes-property",
      "notes-property",
      "notes-property",
      "notes-property",
    ]);
  });

  it("leaves a type and a parameter named notes alone", () => {
    const { files } = deckWith(
      "    <Slide />",
      "type Props = { notes?: string };\nfunction Eigene({ notes: _notes, ...rest }: Props) { return <Slide {...rest} />; }",
    );
    expect(codesOf(files)).toEqual([]);
  });

  it("marks every error as one of notes, with its place", () => {
    const { files } = deckWith("    <Slide notes={spoken} />");
    expect(scan(files).errors).toEqual([
      {
        kind: "notes",
        file: "deck.tsx",
        line: 5,
        column: 12,
        code: "notes-not-literal",
        message: expect.stringContaining("written out") as string,
      },
    ]);
  });
});

describe("blankNotes", () => {
  it("replaces each attribute by spaces and keeps every line where it was", () => {
    const { files } = deckWith(
      '    <Slide id="a" notes="Eine Zeile.\n      Und eine zweite." ground="ink" />',
    );
    const before = files["deck.tsx"] ?? "";
    const after = blankNotes(files, scan(files).attributes)["deck.tsx"] ?? "";
    expect(after).not.toContain("notes");
    expect(after).not.toContain("Eine Zeile");
    expect(after).not.toContain("zweite");
    expect(after).toHaveLength(before.length);
    expect(after.split("\n").length).toBe(before.split("\n").length);
    expect(after.indexOf('ground="ink"')).toBe(before.indexOf('ground="ink"'));
    expect(scan({ "deck.tsx": after }).attributes).toEqual([]);
  });

  it("does not touch the files it was given", () => {
    const { files } = deckWith('    <Slide notes="Bleibt in der Quelle stehen." />');
    const copy = { ...files };
    blankNotes(files, scan(files).attributes);
    expect(files).toEqual(copy);
  });
});

describe("needlesOf", () => {
  it("looks for a plain note as a whole", () => {
    expect(needlesOf("Der Satz des Abends. Langsam sprechen.")).toEqual([
      "Der Satz des Abends. Langsam sprechen.",
    ]);
  });

  it("cuts at what a bundler may write differently, and at line breaks", () => {
    expect(
      needlesOf(
        'Die Zahl "sechsundneunzig" stehen lassen.\n     Zwei Sekunden Pause & dann weiter im Text',
      ),
    ).toEqual(["sechsundneunzig", "stehen lassen.", "Zwei Sekunden Pause", "dann weiter im Text"]);
  });

  it("drops pieces that say too little", () => {
    expect(MIN_NEEDLE).toBe(12);
    expect(needlesOf("Pause.")).toEqual([]);
    expect(needlesOf("elf Zeichen")).toEqual([]);
    expect(needlesOf("zwölf Zeiche")).toEqual(["zwölf Zeiche"]);
  });
});

describe("findLeaks", () => {
  const { files } = deckWith('    <Slide notes="Die Bitte aussprechen, nicht nur zeigen." />');
  const attributes = scan(files).attributes;

  it("finds nothing in a script without the notes' words", () => {
    expect(findLeaks('var a="Etwas ganz anderes steht hier.";', attributes)).toEqual([]);
  });

  it("names the attribute whose words stand in the script", () => {
    expect(
      findLeaks('var a="Die Bitte aussprechen, nicht nur zeigen.";', attributes),
    ).toMatchObject([
      { kind: "notes", code: "notes-in-audience-build", file: "deck.tsx", line: 5, column: 12 },
    ]);
  });
});
