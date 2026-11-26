import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { parsePackage } from "./pack";
import { HELP, run } from "./run";
import { readDeckDir } from "./source";
import { deckTemplate } from "./template";
import { describeWithKit, fixturePath } from "./testing";
import { version } from "./version";

const made: string[] = [];
afterEach(async () => {
  for (const dir of made.splice(0)) await rm(dir, { recursive: true, force: true });
});

/** Runs the command line in a folder of its own and collects what it prints. */
async function slides(...argv: string[]) {
  const cwd = await mkdtemp(join(tmpdir(), "lf-slides-run-"));
  made.push(cwd);
  return slidesIn(cwd, ...argv);
}

/** Runs the command line in the given folder, for a test that runs it more than once there. */
async function slidesIn(cwd: string, ...argv: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const code = await run(argv, {
    out: (line) => out.push(line),
    err: (line) => err.push(line),
    cwd,
  });
  return { code, out, err, cwd };
}

describe("slides, called without a deck", () => {
  it("prints its help, with every command and where it writes", async () => {
    const { code, out } = await slides("--help");
    expect(code).toBe(0);
    expect(out).toEqual([HELP]);
    for (const word of [
      "init <dir>",
      "check <dir>",
      "dev <dir>",
      "build <dir>",
      "pack <dir>",
      "unpack <file> <dir>",
      "--no-browser",
      "--template blank",
      "--force",
      "{ file, bytes, sha256 }",
    ]) {
      expect(HELP).toContain(word);
    }
    expect(HELP).toContain("./slides-out by default");
    expect(HELP).toContain("relative to the current directory");
    expect(HELP).toContain("2 MB");
    expect(HELP).toContain("SLIDES_BROWSER");
  });

  it("prints its version", async () => {
    expect(await slides("--version")).toMatchObject({ code: 0, out: [version] });
    expect(await slides("-v")).toMatchObject({ code: 0, out: [version] });
  });

  it("says how it is called when it is called wrongly", async () => {
    expect((await slides()).code).toBe(2);
    expect(await slides("check")).toMatchObject({
      code: 2,
      err: ["slides: check takes one folder: slides check <dir>", "See slides --help."],
    });
    expect((await slides("publish", "x")).err[0]).toBe(
      "slides: Unknown command. The commands are init, check, dev, build, pack and unpack.",
    );
    expect(await slides("unpack", "paket.json")).toMatchObject({
      code: 2,
      err: [
        "slides: unpack takes a package and a folder: slides unpack <file> <dir>",
        "See slides --help.",
      ],
    });
    expect((await slides("init", "a", "b")).code).toBe(2);
    expect((await slides("check", "a", "b")).code).toBe(2);
    expect(await slides("check", "x", "--fast")).toMatchObject({ code: 2 });
    expect((await slides("dev", fixturePath("sample"), "--port", "http")).err[0]).toBe(
      "slides: --port takes a number from 0 to 65535.",
    );
  });

  it("says when the folder is no deck's", async () => {
    const result = await slides("check", "nicht-da");
    expect(result.code).toBe(2);
    expect(result.err[0]).toMatch(/^slides: Cannot read the deck's folder /);
  });
});

describeWithKit("slides check", () => {
  it("prints nothing but a summary for the sample deck", async () => {
    expect(await slides("check", fixturePath("sample"), "--no-browser")).toMatchObject({
      code: 0,
      out: ["check passed: 10 slides, 0 errors, 0 warnings, layout not checked"],
      err: [],
    });
  });

  it("prints file:line:column lines and exits 1 for a forbidden import", async () => {
    expect(await slides("check", fixturePath("bad-import"), "--no-browser")).toMatchObject({
      code: 1,
      out: [
        'deck.tsx:2:20 error import "lodash" is not allowed (import-not-allowed)',
        "check failed: 1 slide, 1 error, 0 warnings, layout not checked",
      ],
    });
  });

  it("prints JSON and nothing else with --json", async () => {
    const { code, out, err } = await slides(
      "check",
      fixturePath("bad-import"),
      "--json",
      "--no-browser",
    );
    expect(code).toBe(1);
    expect(err).toEqual([]);
    expect(out).toHaveLength(1);
    expect(JSON.parse(out[0] ?? "")).toEqual({
      ok: false,
      diagnostics: [
        {
          file: "deck.tsx",
          line: 2,
          column: 20,
          code: "import-not-allowed",
          message: 'import "lodash" is not allowed',
          severity: "error",
        },
      ],
      report: null,
    });
  });

  it("reads a folder relative to where it is called", async () => {
    const result = await run(["check", "sample", "--no-browser"], {
      out: () => undefined,
      err: () => undefined,
      cwd: fixturePath("."),
    });
    expect(result).toBe(0);
  });
});

describeWithKit("slides build", () => {
  it("needs to know whom the file is for", async () => {
    expect(await slides("build", fixturePath("sample"))).toMatchObject({
      code: 2,
      err: ["slides: build needs --audience or --presenter (or both).", "See slides --help."],
    });
  });

  it("writes <slug>.html and <slug>.presenter.html into ./slides-out", async () => {
    const { code, out, cwd } = await slides(
      "build",
      fixturePath("sample"),
      "--audience",
      "--presenter",
    );
    expect(code).toBe(0);
    expect(await readdir(join(cwd, "slides-out"))).toEqual([
      "der-digitale-handschlag.html",
      "der-digitale-handschlag.presenter.html",
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatch(/^wrote slides-out\/der-digitale-handschlag\.html \(\d+\.\d kB\)$/);
    const audience = await readFile(join(cwd, "slides-out/der-digitale-handschlag.html"), "utf8");
    const presenter = await readFile(
      join(cwd, "slides-out/der-digitale-handschlag.presenter.html"),
      "utf8",
    );
    expect(audience).not.toContain("NOTE-CANARY");
    expect(presenter).toContain("NOTE-CANARY-7f3a91");
  });

  it("writes where --out says", async () => {
    const { code, cwd } = await slides(
      "build",
      fixturePath("pictures"),
      "--presenter",
      "--out",
      "dort/hin",
    );
    expect(code).toBe(0);
    expect(await readdir(join(cwd, "dort/hin"))).toEqual([
      "bilder-und-eigene-bauteile.presenter.html",
    ]);
  });

  it("writes nothing for a deck that does not pass the check", async () => {
    const { code, err, cwd } = await slides("build", fixturePath("bad-import"), "--audience");
    expect(code).toBe(1);
    expect(err).toEqual([
      'deck.tsx:2:20 error import "lodash" is not allowed (import-not-allowed)',
      "not built: the deck has 1 error, 0 warnings",
    ]);
    expect(await readdir(cwd)).toEqual([]);
  });

  it("writes no file for anyone when the notes cannot be left out", async () => {
    const { code, cwd } = await slides("build", fixturePath("notes-forms"), "--presenter");
    expect(code).toBe(1);
    expect(await readdir(cwd)).toEqual([]);
  });
});

describeWithKit("slides pack", () => {
  it("writes a package that reads back as the deck", async () => {
    const { code, out, cwd } = await slides("pack", fixturePath("pictures"));
    expect(code).toBe(0);
    expect(out[0]).toMatch(/^wrote slides-out\/bilder-und-eigene-bauteile\.deck\.json /);
    const json = await readFile(
      join(cwd, "slides-out/bilder-und-eigene-bauteile.deck.json"),
      "utf8",
    );
    const deck = parsePackage(json);
    expect(Object.keys(deck.files)).toEqual(["deck.tsx", "parts/werkbank.tsx"]);
    expect(deck.manifest.slides).toBe(2);
  });

  it("writes to the file --out names, and packs nothing that does not pass", async () => {
    const named = await slides("pack", fixturePath("sample"), "--out", "paket.json");
    expect(await readdir(named.cwd)).toEqual(["paket.json"]);
    const refused = await slides("pack", fixturePath("bad-import"));
    expect(refused.code).toBe(1);
    expect(refused.err.at(-1)).toBe("not packed: the deck has 1 error, 0 warnings");
    expect(await readdir(refused.cwd)).toEqual([]);
  });

  it("prints the file, its size and its hash as JSON and nothing else with --json", async () => {
    const { code, out, err, cwd } = await slides("pack", fixturePath("pictures"), "--json");
    expect(code).toBe(0);
    expect(err).toEqual([]);
    expect(out).toHaveLength(1);
    const file = join(cwd, "slides-out/bilder-und-eigene-bauteile.deck.json");
    const data = await readFile(file);
    expect(JSON.parse(out[0] ?? "")).toEqual({
      file,
      bytes: data.byteLength,
      sha256: createHash("sha256").update(data).digest("hex"),
    });
  });
});

describeWithKit("slides unpack", () => {
  it("writes a package back to a folder that packs to the same bytes", async () => {
    const { cwd } = await slides("pack", fixturePath("pictures"), "--out", "eins.json");
    const unpacked = await slidesIn(cwd, "unpack", "eins.json", "deck");
    expect(unpacked).toMatchObject({ code: 0, out: ["wrote 4 files to deck"], err: [] });
    expect(await readFile(join(cwd, "deck/bilder/punkt.png"))).toEqual(
      await readFile(fixturePath("pictures/bilder/punkt.png")),
    );
    expect((await slidesIn(cwd, "pack", "deck", "--out", "zwei.json")).code).toBe(0);
    expect(await readFile(join(cwd, "zwei.json"), "utf8")).toBe(
      await readFile(join(cwd, "eins.json"), "utf8"),
    );
  });

  it("refuses a folder that is not empty unless --force is given", async () => {
    const { cwd } = await slides("pack", fixturePath("pictures"), "--out", "paket.json");
    await writeFile(join(cwd, "notizen.md"), "# bleibt");
    const refused = await slidesIn(cwd, "unpack", "paket.json", ".");
    expect(refused.code).toBe(2);
    expect(refused.err[0]).toMatch(/^slides: The folder ".+" is not empty\. --force writes/);
    expect((await readdir(cwd)).sort()).toEqual(["notizen.md", "paket.json"]);
    expect((await slidesIn(cwd, "unpack", "paket.json", ".", "--force")).code).toBe(0);
    expect((await readdir(cwd)).sort()).toEqual([
      "bilder",
      "deck.tsx",
      "notizen.md",
      "paket.json",
      "parts",
    ]);
  });

  it("says when the file is missing or no package, and writes nothing", async () => {
    const missing = await slides("unpack", "fehlt.json", "deck");
    expect(missing).toMatchObject({
      code: 2,
      err: ['slides: Cannot read the package "fehlt.json".'],
    });
    const { cwd } = missing;
    await writeFile(join(cwd, "kaputt.json"), "{");
    expect(await slidesIn(cwd, "unpack", "kaputt.json", "deck")).toMatchObject({
      code: 2,
      err: ["slides: The package is not JSON."],
    });
    expect(await readdir(cwd)).toEqual(["kaputt.json"]);
  });
});

describeWithKit("slides init", () => {
  it("writes the blank template, which passes the check", async () => {
    const { code, out, cwd } = await slides("init", "vortrag");
    expect(code).toBe(0);
    expect(out).toEqual(["wrote 4 files to vortrag", "next: slides dev vortrag"]);
    const read = await readDeckDir(join(cwd, "vortrag"));
    expect(read).toEqual(deckTemplate("blank", { title: "Untitled deck", lang: "en" }));
    expect(await slidesIn(cwd, "check", "vortrag", "--no-browser")).toMatchObject({
      code: 0,
      out: ["check passed: 2 slides, 0 errors, 0 warnings, layout not checked"],
    });
  });

  it("takes a title and a language", async () => {
    const { code, cwd } = await slides("init", "q3", "--title", "Quarterly review", "--lang", "de");
    expect(code).toBe(0);
    const text = await readFile(join(cwd, "q3/deck.tsx"), "utf8");
    expect(text).toContain('<Deck title="Quarterly review" lang="de">');
  });

  it("refuses a template it does not have, a wrong value and a folder that is not empty", async () => {
    expect(await slides("init", "x", "--template", "pitch")).toMatchObject({
      code: 2,
      err: ["slides: --template takes blank.", "See slides --help."],
    });
    expect(await slides("init", "x", "--lang", "en GB")).toMatchObject({
      code: 2,
      err: ['slides: The language has to be a tag such as "en" or "de-CH".'],
    });
    const { cwd } = await slides("init", "x");
    const again = await slidesIn(cwd, "init", "x");
    expect(again.code).toBe(2);
    expect(again.err[0]).toMatch(/is not empty/);
    expect((await slidesIn(cwd, "init", "x", "--force", "--title", "Neu")).code).toBe(0);
    expect(await readFile(join(cwd, "x/deck.tsx"), "utf8")).toContain('title="Neu"');
  });
});
