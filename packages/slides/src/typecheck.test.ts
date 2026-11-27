import { existsSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, it } from "vitest";

import { deckOf, deckWith, describeWithKit, fixture, HEAD } from "./testing";
import { mayRead, scrub, typecheckDeck } from "./typecheck";
import type { DeckError, DeckInput } from "./types";

const REPO = fileURLToPath(new URL("../../..", import.meta.url)).replace(/[\\/]$/, "");
const inRepo = (path: string) => `${REPO}/${path}`;

/**
 * `typecheckDeck`, with every message it hands back read for a path of this machine: none may
 * name where the repository, the tool or a package is installed.
 */
async function checked(input: DeckInput): Promise<DeckError[]> {
  const errors = await typecheckDeck(input);
  for (const { message } of errors) {
    expect(message).not.toContain(REPO);
    expect(message).not.toContain("/home/");
    expect(message).not.toContain("node_modules");
    expect(message).not.toContain("__deck__");
  }
  return errors;
}

const REFUSED = (attribute: string) =>
  `/// <reference ${attribute}> is not allowed in a deck: a deck takes in its own files, ` +
  "React and the kit by import, and nothing else";

describeWithKit("typecheckDeck", () => {
  it.each(["sample", "pictures", "broken", "notes-forms"])(
    "finds nothing in the %s fixture",
    async (name) => {
      expect(await checked(await fixture(name))).toEqual([]);
    },
  );

  it("checks a prop against the kit's declarations", async () => {
    const errors = await checked(
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
    const errors = await checked(
      deckOf(
        'import { Deck, Folie } from "@lanfermann/ui/slides";\nexport default (<Deck><Folie /></Deck>);\n',
      ),
    );
    expect(errors.map((error) => error.code)).toEqual(["ts2305", "ts2741"]);
    expect(errors.every((error) => error.kind === "type")).toBe(true);
  });

  it("is strict", async () => {
    const errors = await checked(
      deckWith("    <Slide />", "function laut(text) { return text.toUpperCase(); }\nlaut(1);"),
    );
    expect(errors).toMatchObject([{ code: "ts7006", line: 2 }]);
  });

  it("marks code that does not parse as a syntax error", async () => {
    const errors = await checked(deckOf(`${HEAD}export default (<Deck title="Probe">\n`));
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
    expect(await checked(source)).toEqual([]);
    source.files["parts/zahl.ts"] = 'export const zahl: string = "drei";\n';
    // 'toFixed' does not exist on type 'string'.
    expect(await checked(source)).toMatchObject([
      { kind: "type", code: "ts2551", file: "deck.tsx", line: 6 },
    ]);
  });

  it("resolves nothing but React, the kit and the deck", async () => {
    // TypeScript and esbuild are installed right beside this tool, and Node's types too.
    const source = deckWith(
      "    <Slide />",
      'import ts from "typescript";\nimport { build } from "esbuild";\nimport { readFileSync } from "node:fs";\nimport up from "../../package.json";\nconsole.log(ts, build, readFileSync, up, process.env);',
    );
    const errors = await checked(source);
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
    const errors = await checked({
      entry: "folien.tsx",
      files: {
        "folien.tsx": `${HEAD}export default (<Deck title="Probe" lang={5}><Slide /></Deck>);\n`,
      },
    });
    expect(errors).toMatchObject([{ kind: "type", code: "ts2322", file: "folien.tsx", line: 2 }]);
  });

  // `process` is known only with Node's types: the compiler still not knowing it shows that a
  // directive took nothing in. The paths are real ones, seen from the deck's place in memory.
  it.each([
    ["a file of the machine", '/// <reference path="/etc/hosts" />', "path"],
    ["a file above the deck", '/// <reference path="../../../../eslint.config.js" />', "path"],
    [
      "a declaration file beside this tool",
      '/// <reference path="../../node_modules/@types/node/index.d.ts" />',
      "path",
    ],
    ["the types of a package", '/// <reference types="node" />', "types"],
    ["a library", '/// <reference lib="es2015" />', "lib"],
    ["no default library", '/// <reference no-default-lib="true" />', "no-default-lib"],
    ["a directive in capitals, without blanks", '///<REFERENCE PATH="/etc/hosts"/>', "path"],
    ["a directive that names nothing", '/// <reference resolution-mode="import" />', undefined],
  ])("refuses a reference to %s, and takes nothing in", async (_, directive, attribute) => {
    const errors = await checked(
      deckOf(
        `// Probe\n${directive}\n${HEAD}console.log(process.env);\n` +
          'export default (<Deck title="Probe"><Slide /></Deck>);\n',
      ),
    );
    expect(errors).toEqual([
      {
        kind: "import",
        code: "reference-not-allowed",
        file: "deck.tsx",
        line: 2,
        column: 1,
        message: attribute === undefined ? REFUSED("").replace(" >", ">") : REFUSED(attribute),
      },
      // The one error of the deck's own, as without the directive: nothing else comes of it.
      {
        kind: "type",
        code: "ts2591",
        file: "deck.tsx",
        line: 4,
        column: 13,
        message: expect.stringContaining("'process'") as string,
      },
    ]);
  });

  it("refuses each directive of each file at its own place, and checks the rest as ever", async () => {
    const source = deckWith(
      '    <Slide ground="grün"><Title>{zahl}</Title></Slide>',
      'import { zahl } from "./parts/zahl";',
    );
    source.files["parts/zahl.ts"] =
      '/// <reference types="node" />\n  /// <reference path="../../../../../package.json" />\n' +
      "export const zahl: number = 3;\n";
    expect(await checked(source)).toEqual([
      {
        kind: "import",
        code: "reference-not-allowed",
        file: "parts/zahl.ts",
        line: 1,
        column: 1,
        message: REFUSED("types"),
      },
      {
        kind: "import",
        code: "reference-not-allowed",
        file: "parts/zahl.ts",
        line: 2,
        column: 3,
        message: REFUSED("path"),
      },
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

  it("leaves a triple-slash comment alone where the compiler reads no directive", async () => {
    // After the first line of code, and inside a block comment.
    const late = deckWith("    <Slide />", '/// <reference path="/etc/hosts" />');
    expect(await checked(late)).toEqual([]);
    const block = deckOf(
      `/* Notiz:\n/// <reference path="/etc/hosts" />\n*/\n${HEAD}export default (<Deck title="Probe"><Slide /></Deck>);\n`,
    );
    expect(await checked(block)).toEqual([]);
  });

  it("names a file of the deck by its path in the deck, and the kit by its package", async () => {
    const source = deckWith(
      "    <Slide><Title>{String(b) + String(c)}</Title></Slide>",
      'import type { Karte as A } from "./parts/a";\nimport type { Karte as B, SlideStep } from "./parts/b";\nimport type { SlideStep as KitStep } from "@lanfermann/ui/slides";\ndeclare const a: A;\ndeclare const kit: KitStep;\nconst b: B = a;\nconst c: SlideStep = kit;',
    );
    source.files["parts/a.ts"] = "export type Karte = { titel: string };\n";
    source.files["parts/b.ts"] =
      "export type Karte = { nummer: number };\nexport type SlideStep = { nummer: number };\n";
    const errors = await checked(source);
    // Two types of one name: the compiler tells them apart by the file each is from.
    expect(errors.map((error) => [error.code, error.line, error.message])).toEqual([
      [
        "ts2741",
        7,
        "Property 'nummer' is missing in type 'import(\"parts/a\").Karte' but required in type 'import(\"parts/b\").Karte'.",
      ],
      [
        "ts2741",
        8,
        "Property 'nummer' is missing in type 'import(\"@lanfermann/ui/dist/slides/step/step-context\").SlideStep' but required in type 'import(\"parts/b\").SlideStep'.",
      ],
    ]);
  });

  it("keeps what a deck writes itself in a message, also where it reads like a path", async () => {
    const errors = await checked(
      deckWith("    <Slide />", 'const pfad: "/a/b/c" = "/x/y/z";\nconst halb = "a" / 2;'),
    );
    expect(errors.map((error) => error.message)).toEqual([
      "Type '\"/x/y/z\"' is not assignable to type '\"/a/b/c\"'.",
      expect.stringContaining("arithmetic operation") as string,
    ]);
  });
});

describeWithKit("scrub", () => {
  it("names a file of the deck by its path in it, and a granted folder by its package", () => {
    const deck = inRepo("packages/slides/src/__deck__");
    expect(scrub(`File '${deck}/parts/zahl.ts' is not a module.`)).toBe(
      "File 'parts/zahl.ts' is not a module.",
    );
    expect(scrub(`import("${deck}/parts/a").Karte`)).toBe('import("parts/a").Karte');
    expect(scrub(`import("${inRepo("packages/ui/dist/slides/slide/slide")}").SlideProps`)).toBe(
      'import("@lanfermann/ui/dist/slides/slide/slide").SlideProps',
    );
    // React's types by their real folder, and csstype both as they find it and where it is.
    const react = realpathSync(inRepo("packages/slides/node_modules/@types/react"));
    const beside = join(dirname(dirname(react)), "csstype");
    expect(scrub(`File '${react}/index.d.ts' and '${beside}/index.d.ts'.`)).toBe(
      "File '@types/react/index.d.ts' and 'csstype/index.d.ts'.",
    );
    expect(scrub(`import("${realpathSync(beside)}/index").Property`)).toBe(
      'import("csstype/index").Property',
    );
  });

  it("does not name any other file of the machine", () => {
    expect(scrub(`File '${inRepo("eslint.config.js")}' is a JavaScript file.`)).toBe(
      "File 'a file outside the deck' is a JavaScript file.",
    );
    expect(scrub("Could not resolve the path '/etc/hosts/x' with the extensions: '.ts'.")).toBe(
      "Could not resolve the path 'a file outside the deck' with the extensions: '.ts'.",
    );
    expect(scrub('Type import("/srv/app/geheim").Kunde is not assignable.')).toBe(
      'Type import("a file outside the deck").Kunde is not assignable.',
    );
    expect(scrub("File 'C:\\Users\\justin\\x.ts' not found.")).toBe(
      "File 'a file outside the deck' not found.",
    );
  });

  it("leaves what is no path as it stands", () => {
    for (const message of [
      "Operator '/' cannot be applied to types 'string' and 'number'.",
      "Type '\"/x/y/z\"' is not assignable to type '\"/a/b/c\"'.",
      "Cannot find name 'process'.",
      "Type '\"grün\"' is not assignable to type 'SlideGround | undefined'.",
    ]) {
      expect(scrub(message)).toBe(message);
    }
  });
});

describeWithKit("mayRead", () => {
  it("grants the compiler's library, React's types with csstype, and the kit's declarations", () => {
    const react = realpathSync(inRepo("packages/slides/node_modules/@types/react"));
    for (const path of [
      inRepo("packages/slides/node_modules/@types/react/index.d.ts"),
      inRepo("packages/slides/node_modules/@types/react/package.json"),
      `${react}/jsx-runtime.d.ts`,
      `${react}/../../csstype/index.d.ts`,
      realpathSync(`${react}/../../csstype/package.json`),
      inRepo("packages/slides/node_modules/@lanfermann/ui/package.json"),
      inRepo("packages/slides/node_modules/@lanfermann/ui/dist/slides/index.d.ts"),
      inRepo("packages/ui/dist/slides/slide/slide.d.ts"),
      `${realpathSync(inRepo("packages/slides/node_modules/typescript"))}/lib/lib.es5.d.ts`,
    ]) {
      expect(existsSync(path), path).toBe(true);
      expect(mayRead(path), path).toBe(true);
    }
  });

  it("grants no other file, although it is there: not the kit's source, not a package beside", () => {
    const typescript = realpathSync(inRepo("packages/slides/node_modules/typescript"));
    for (const path of [
      "/etc/hosts",
      inRepo("eslint.config.js"),
      inRepo("package.json"),
      inRepo("packages/slides/package.json"),
      inRepo("packages/slides/src/typecheck.ts"),
      // The kit is a link to its whole workspace folder here: only dist and package.json count.
      inRepo("packages/ui/src/index.ts"),
      inRepo("packages/ui/tsconfig.json"),
      inRepo("packages/slides/node_modules/@lanfermann/ui/src/index.ts"),
      inRepo("packages/ui/node_modules/react/package.json"),
      inRepo("packages/ui/dist/../src/index.ts"),
      inRepo("packages/slides/node_modules/@types/node/index.d.ts"),
      realpathSync(inRepo("packages/slides/node_modules/@types/node/index.d.ts")),
      inRepo("packages/slides/node_modules/esbuild/package.json"),
      // Of the compiler only its library files, not its program and not its manifest.
      `${typescript}/package.json`,
      `${typescript}/lib/typescript.js`,
      `${typescript}/lib/../package.json`,
    ]) {
      expect(existsSync(path), path).toBe(true);
      expect(mayRead(path), path).toBe(false);
    }
  });

  it("grants no folder on the way to a granted one, and nothing that is not there", () => {
    for (const path of [
      "/",
      REPO,
      inRepo("packages"),
      inRepo("packages/slides/node_modules"),
      inRepo("packages/slides/node_modules/@types"),
      inRepo("packages/ui/node_modules"),
      "",
      "lib.es5.d.ts",
      "../../etc/hosts",
    ]) {
      expect(mayRead(path), path).toBe(false);
    }
  });
});
