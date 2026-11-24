import { createHash } from "node:crypto";

import { expect, it } from "vitest";

import { assetsFor, buildDeck } from "./build";
import { checkDeck } from "./check";
import { kitVersion } from "./kit";
import { deckWith, describeWithKit, fixture } from "./testing";
import { formatDiagnostic } from "./types";

const hash = (text: string) => `'sha256-${createHash("sha256").update(text).digest("base64")}'`;
const scriptsOf = (html: string) =>
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1] ?? "");
const policyOf = (html: string) =>
  /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(html)?.[1] ?? "";

describeWithKit("buildDeck", () => {
  it("builds the sample deck for an audience without a word of its notes", async () => {
    const source = await fixture("sample");
    const presenter = await buildDeck(source, { mode: "presenter" });
    const audience = await buildDeck(source, { mode: "audience" });
    expect(presenter.errors).toEqual([]);
    expect(audience.errors).toEqual([]);
    expect(audience.kitVersion).toBe(kitVersion());

    expect(presenter.html).toContain("NOTE-CANARY-7f3a91");
    expect(audience.html).not.toContain("NOTE-CANARY");
    // Not one of the ten notes, by a piece of each.
    for (const piece of [
      "Wer ich bin, in einem Satz",
      "Die Zahl stehen lassen",
      "dass das ein Laborwert ist",
      "Langsam sprechen",
      "Die Beispielseite ist erfunden",
      "Die Einwände vorlesen",
      "Automatisierung nur erwähnen",
      "Das offen sagen",
      "Festpreise nennen",
      "Visitenkarten liegen am Ausgang",
    ]) {
      expect(presenter.html).toContain(piece);
      expect(audience.html).not.toContain(piece);
    }
    expect(audience.html).toContain("<title>Der digitale Handschlag</title>");
    expect(audience.html).toContain('<html lang="de">');
  });

  it("lets an audience's file open no console, and a presenter's both", async () => {
    const source = await fixture("sample");
    const audience = (await buildDeck(source, { mode: "audience" })).html ?? "";
    const presenter = (await buildDeck(source, { mode: "presenter" })).html ?? "";
    expect(scriptsOf(audience).at(-1)).toContain(
      '"mode":"audience","modes":["audience","print","check"]',
    );
    expect(scriptsOf(presenter).at(-1)).toContain(
      '"mode":"presenter","modes":["presenter","audience","print","check"]',
    );
  });

  it("gives the file a policy whose hashes are those of its own scripts", async () => {
    const html = (await buildDeck(await fixture("sample"), { mode: "audience" })).html ?? "";
    const policy = policyOf(html);
    expect(policy).toContain("default-src 'none'");
    const scripts = scriptsOf(html);
    expect(scripts).toHaveLength(3);
    expect(policy).toContain(`script-src ${scripts.map(hash).join(" ")};`);
  });

  it("links the PDF when it is given its name", async () => {
    const html = (await buildDeck(await fixture("sample"), { mode: "audience", pdfName: "a.pdf" }))
      .html;
    expect(html).toContain('"pdf":"a.pdf"');
  });

  it("puts the deck's pictures into the file as data URLs", async () => {
    const source = await fixture("pictures");
    const { html = "", errors } = await buildDeck(source, { mode: "audience" });
    expect(errors).toEqual([]);
    expect(html).not.toContain("./bilder/");
    expect(html).toContain(
      `"data:image/png;base64,${Buffer.from(source.images["bilder/punkt.png"] ?? []).toString("base64")}"`,
    );
    expect(html).toContain('"data:image/svg+xml;base64,');
    expect(policyOf(html)).toContain(`script-src ${scriptsOf(html).map(hash).join(" ")};`);
  });

  it("makes data URLs only of the pictures the script names", () => {
    const images = { "a.png": new Uint8Array([1]), "b/c.svg": new Uint8Array([2]) };
    expect(assetsFor('x("./b/c.svg")', images)).toEqual({
      "./b/c.svg": "data:image/svg+xml;base64,Ag==",
    });
    expect(assetsFor("x()", images)).toEqual({});
    expect(assetsFor('x("./a.png")')).toEqual({});
  });

  it("gives no file to an audience when the notes cannot be left out for certain", async () => {
    const source = await fixture("notes-forms");
    const audience = await buildDeck(source, { mode: "audience" });
    expect(audience.ok).toBe(false);
    expect(audience.html).toBeUndefined();
    expect(audience.errors.map((error) => error.code)).toEqual([
      "notes-not-literal",
      "spread-on-slide",
    ]);
  });

  it("gives no file for a deck with a forbidden import", async () => {
    const result = await buildDeck(await fixture("bad-import"), { mode: "presenter" });
    expect(result).toMatchObject({ ok: false, errors: [{ kind: "import", line: 2, column: 20 }] });
    expect(result.html).toBeUndefined();
  });
});

describeWithKit("checkDeck, without a browser", () => {
  it("passes the sample deck and the one with pictures", async () => {
    expect(await checkDeck(await fixture("sample"), { browser: false })).toEqual({
      ok: true,
      diagnostics: [],
    });
    expect(await checkDeck(await fixture("pictures"), { browser: false })).toEqual({
      ok: true,
      diagnostics: [],
    });
  });

  it("says a forbidden import once, in its own words", async () => {
    const result = await checkDeck(await fixture("bad-import"), { browser: false });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.map(formatDiagnostic)).toEqual([
      'deck.tsx:2:20 error import "lodash" is not allowed (import-not-allowed)',
    ]);
  });

  it("reports the notes of the notes-forms fixture once each", async () => {
    const result = await checkDeck(await fixture("notes-forms"), { browser: false });
    expect(result.diagnostics.map((diagnostic) => [diagnostic.code, diagnostic.line])).toEqual([
      ["notes-ignored", 11],
      ["notes-not-literal", 25],
      ["spread-on-slide", 28],
    ]);
  });

  it("reports types, classes and code that does not parse", async () => {
    const typed = await checkDeck(
      deckWith('    <Slide ground="grün" className="erfunden"><Title>Eine Folie.</Title></Slide>'),
      { browser: false },
    );
    expect(typed.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "ts2322",
      "unknown-class",
    ]);

    const broken = deckWith("    <Slide>");
    const parsed = await checkDeck(broken, { browser: false });
    expect(parsed.ok).toBe(false);
    // In the compiler's words only: the bundler's line for the same thing is left out.
    expect(parsed.diagnostics.every((diagnostic) => diagnostic.code !== "bundle")).toBe(true);
    expect(parsed.diagnostics.some((diagnostic) => /^ts\d+$/.test(diagnostic.code))).toBe(true);
  });

  it("reports a deck without a deck.tsx", async () => {
    const result = await checkDeck({ entry: "deck.tsx", files: {} }, { browser: false });
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(["no-default-deck"]);
  });

  it("makes a missing browser a warning by default and an error when one was asked for", async () => {
    const source = await fixture("sample");
    const launch = { executablePath: "/nowhere/there-is-no-browser-here" };
    const auto = await checkDeck(source, { launch });
    expect(auto.ok).toBe(true);
    expect(auto.report).toBeUndefined();
    expect(auto.diagnostics).toMatchObject([
      { code: "browser-not-found", severity: "warning", file: "deck.tsx", line: 1 },
    ]);
    const asked = await checkDeck(source, { browser: true, launch });
    expect(asked.ok).toBe(false);
    expect(asked.diagnostics).toMatchObject([{ code: "browser-not-found", severity: "error" }]);
  });
});
