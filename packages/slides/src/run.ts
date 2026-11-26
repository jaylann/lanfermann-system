import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import { analyzeDeck } from "./analyze";
import { BrowserUnavailableError, DeckNotReadyError, renderPdf } from "./browser";
import { buildDeck } from "./build";
import { checkDeck } from "./check";
import { startDevServer } from "./dev";
import { KitError } from "./kit";
import { PackageError, packDeck, parsePackage, serializePackage, slugOf } from "./pack";
import { DeckReadError, DeckWriteError, readDeckDir, writeDeckDir } from "./source";
import { deckTemplate, isTemplateName, TEMPLATE_NAMES, TemplateError } from "./template";
import {
  type DeckError,
  type DeckSource,
  type Diagnostic,
  diagnosticOf,
  formatDiagnostic,
} from "./types";
import { version } from "./version";

/** Where a command writes and what it takes as the current folder. */
export type RunIo = {
  out: (line: string) => void;
  err: (line: string) => void;
  cwd: string;
};

export const HELP = `slides: start, check, preview, build and pack a slide deck

A deck is a folder with a deck.tsx whose default export is a <Deck> element
from @lanfermann/ui/slides. The format: docs/deck-format.md of this package.

Usage
  slides init <dir> [--template blank] [--title <text>] [--lang <tag>] [--force]
  slides check <dir> [--no-browser] [--json]
  slides dev <dir> [--port 4173] [--audience]
  slides build <dir> (--audience | --presenter) [--pdf] [--out <dir>]
  slides pack <dir> [--out <file>] [--json]
  slides unpack <file> <dir> [--force]
  slides --help | --version

Commands
  init    Writes a new deck into an empty folder: a deck.tsx with a cover
          and a closing slide, and parts/, data/ and images/, each with a
          file that says what goes there. --title is the deck's title
          ("Untitled deck" by default), --lang its language ("en").
  check   Imports, names, notes, classes, types, and (with a browser) the
          layout of every slide. Prints file:line:column lines and exits 1
          on any error. --json prints { ok, diagnostics, report } only.
          --no-browser leaves the layout unchecked.
  dev     Serves the presenter's view on 127.0.0.1 and builds again when a
          file changes. --audience serves what an audience gets.
  build   Writes one HTML file that runs from a disk without a network:
          <slug>.html for an audience (no notes inside), or
          <slug>.presenter.html. Both flags give both files. --pdf also
          writes <slug>.pdf, and the audience's file links it.
          --out is the folder to write to: ./slides-out by default,
          relative to the current directory.
  pack    Writes the deck's source as one JSON file for the hub:
          ./slides-out/<slug>.deck.json unless --out names a file. --json
          prints { file, bytes, sha256 } of the written file and nothing else.
  unpack  Writes a package back to a folder, pictures included. Like init,
          it refuses a folder that is not empty; --force writes into it and
          replaces the files of the same name.

A picture may weigh 2 MB, all pictures of a deck 12 MB.

The layout check and --pdf need playwright-core and a Chrome on this
machine. SLIDES_BROWSER picks another browser: a channel (chrome,
chromium, msedge) or the path of a program.
`;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const kilobytes = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`;

/** A mistake in how the tool was called. */
class UsageError extends Error {
  override readonly name = "UsageError";
}

function counts(diagnostics: readonly Diagnostic[]): string {
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
  return `${plural(errors, "error")}, ${plural(diagnostics.length - errors, "warning")}`;
}

/** The static and the type check before a build or a pack: what does not pass is not written. */
async function passes(source: DeckSource, io: RunIo, what: string): Promise<boolean> {
  const check = await checkDeck(source, { browser: false });
  for (const diagnostic of check.diagnostics) io.err(formatDiagnostic(diagnostic));
  if (!check.ok) io.err(`${what}: the deck has ${counts(check.diagnostics)}`);
  return check.ok;
}

/** A path as the output names it: from the current folder when it is inside it, else whole. */
function shown(path: string, io: RunIo): string {
  const inside = relative(io.cwd, path);
  return inside === "" || inside.startsWith("..") || isAbsolute(inside) ? path : inside;
}

async function save(file: string, data: string | Uint8Array): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, data);
}

async function write(file: string, data: string | Uint8Array, io: RunIo): Promise<void> {
  await save(file, data);
  const bytes = typeof data === "string" ? Buffer.byteLength(data) : data.byteLength;
  io.out(`wrote ${shown(file, io)} (${kilobytes(bytes)})`);
}

async function check(dir: string, flags: { json: boolean; browser: boolean }, io: RunIo) {
  const source = await readDeckDir(resolve(io.cwd, dir));
  const result = await checkDeck(source, { browser: flags.browser ? "auto" : false });
  if (flags.json) {
    const { ok, diagnostics, report = null } = result;
    io.out(JSON.stringify({ ok, diagnostics, report }, null, 2));
    return result.ok ? 0 : 1;
  }
  for (const diagnostic of result.diagnostics) io.out(formatDiagnostic(diagnostic));
  const slides = plural(analyzeDeck(source).slides.length, "slide");
  const layout = result.report === undefined ? ", layout not checked" : "";
  io.out(
    `check ${result.ok ? "passed" : "failed"}: ${slides}, ${counts(result.diagnostics)}${layout}`,
  );
  return result.ok ? 0 : 1;
}

async function build(
  dir: string,
  flags: { audience: boolean; presenter: boolean; pdf: boolean; out: string },
  io: RunIo,
) {
  if (!flags.audience && !flags.presenter) {
    throw new UsageError("build needs --audience or --presenter (or both).");
  }
  const source = await readDeckDir(resolve(io.cwd, dir));
  if (!(await passes(source, io, "not built"))) return 1;

  const slug = slugOf(analyzeDeck(source).title ?? "");
  const folder = resolve(io.cwd, flags.out);
  const pdfName = flags.pdf ? `${slug}.pdf` : undefined;
  const made: [string, string | Uint8Array][] = [];
  const fail = (errors: readonly DeckError[]) => {
    for (const error of errors) io.err(formatDiagnostic(diagnosticOf(error, source.entry)));
    io.err("not built");
    return 1;
  };

  if (flags.audience || flags.pdf) {
    const audience = await buildDeck(source, {
      mode: "audience",
      ...(pdfName === undefined ? {} : { pdfName }),
    });
    if (audience.html === undefined) return fail(audience.errors);
    if (flags.audience) made.push([join(folder, `${slug}.html`), audience.html]);
    // Printed from the audience's file: a PDF's source holds no notes either.
    if (pdfName !== undefined) made.push([join(folder, pdfName), await renderPdf(audience.html)]);
  }
  if (flags.presenter) {
    const presenter = await buildDeck(source, {
      mode: "presenter",
      ...(pdfName === undefined ? {} : { pdfName }),
    });
    if (presenter.html === undefined) return fail(presenter.errors);
    made.push([join(folder, `${slug}.presenter.html`), presenter.html]);
  }
  // Only now, with everything made: a failed PDF leaves no file that links it.
  for (const [file, data] of made) await write(file, data, io);
  return 0;
}

async function pack(dir: string, flags: { out?: string; json: boolean }, io: RunIo) {
  const source = await readDeckDir(resolve(io.cwd, dir));
  if (!(await passes(source, io, "not packed"))) return 1;
  const deck = packDeck(source);
  const file = resolve(io.cwd, flags.out ?? join("slides-out", `${deck.manifest.slug}.deck.json`));
  const data = Buffer.from(serializePackage(deck), "utf8");
  if (!flags.json) {
    await write(file, data, io);
    return 0;
  }
  await save(file, data);
  const sha256 = createHash("sha256").update(data).digest("hex");
  io.out(JSON.stringify({ file, bytes: data.byteLength, sha256 }, null, 2));
  return 0;
}

async function unpack(file: string, dir: string, flags: { force: boolean }, io: RunIo) {
  let json: string;
  try {
    json = await readFile(resolve(io.cwd, file), "utf8");
  } catch (cause) {
    throw new PackageError(`Cannot read the package ${JSON.stringify(file)}.`, { cause });
  }
  const { manifest: _manifest, ...source } = parsePackage(json);
  const folder = resolve(io.cwd, dir);
  const written = await writeDeckDir(folder, source, { force: flags.force });
  io.out(`wrote ${plural(written.length, "file")} to ${shown(folder, io)}`);
  return 0;
}

async function init(
  dir: string,
  flags: { template: string; title: string; lang: string; force: boolean },
  io: RunIo,
) {
  if (!isTemplateName(flags.template)) {
    throw new UsageError(`--template takes ${TEMPLATE_NAMES.join(", ")}.`);
  }
  const source = deckTemplate(flags.template, { title: flags.title, lang: flags.lang });
  const folder = resolve(io.cwd, dir);
  const written = await writeDeckDir(folder, source, { force: flags.force });
  io.out(`wrote ${plural(written.length, "file")} to ${shown(folder, io)}`);
  io.out(`next: slides dev ${dir}`);
  return 0;
}

async function dev(dir: string, flags: { port: string; audience: boolean }, io: RunIo) {
  const port = Number(flags.port);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new UsageError("--port takes a number from 0 to 65535.");
  }
  const server = await startDevServer({
    dir: resolve(io.cwd, dir),
    port,
    audience: flags.audience,
    log: io.err,
  }).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "EADDRINUSE") {
      throw new UsageError(`Port ${port} is taken. Pick another with --port.`);
    }
    throw error;
  });
  io.out(`serving ${server.url} (Ctrl+C stops it)`);
  await new Promise<void>((stop) => {
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  });
  await server.close();
  return 0;
}

/**
 * Runs the command line: `argv` without the program's own two entries. Returns the exit code:
 * 0, 1 when the deck has an error, 2 when the tool was called wrongly or cannot work here (no
 * kit, no browser for a PDF, a folder that is no deck, a package that does not hold, a folder
 * to write to that is not empty).
 */
export async function run(argv: readonly string[], io: RunIo): Promise<number> {
  try {
    const { values, positionals } = parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: {
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
        json: { type: "boolean" },
        "no-browser": { type: "boolean" },
        audience: { type: "boolean" },
        presenter: { type: "boolean" },
        pdf: { type: "boolean" },
        out: { type: "string" },
        port: { type: "string" },
        force: { type: "boolean" },
        template: { type: "string" },
        title: { type: "string" },
        lang: { type: "string" },
      },
    });
    if (values.version) {
      io.out(version);
      return 0;
    }
    const [command, ...operands] = positionals;
    if (values.help || command === undefined) {
      io.out(HELP);
      return values.help ? 0 : 2;
    }
    if (command === "unpack") {
      const [file, dir, ...rest] = operands;
      if (file === undefined || dir === undefined || rest.length > 0) {
        throw new UsageError("unpack takes a package and a folder: slides unpack <file> <dir>");
      }
      return await unpack(file, dir, { force: values.force === true }, io);
    }
    const [dir, ...rest] = operands;
    if (dir === undefined || rest.length > 0) {
      throw new UsageError(`${command} takes one folder: slides ${command} <dir>`);
    }
    switch (command) {
      case "check":
        return await check(
          dir,
          { json: values.json === true, browser: values["no-browser"] !== true },
          io,
        );
      case "build":
        return await build(
          dir,
          {
            audience: values.audience === true,
            presenter: values.presenter === true,
            pdf: values.pdf === true,
            out: values.out ?? "slides-out",
          },
          io,
        );
      case "pack":
        return await pack(
          dir,
          { json: values.json === true, ...(values.out === undefined ? {} : { out: values.out }) },
          io,
        );
      case "init":
        return await init(
          dir,
          {
            template: values.template ?? "blank",
            title: values.title ?? "Untitled deck",
            lang: values.lang ?? "en",
            force: values.force === true,
          },
          io,
        );
      case "dev":
        return await dev(
          dir,
          { port: values.port ?? "4173", audience: values.audience === true },
          io,
        );
      default:
        throw new UsageError(
          "Unknown command. The commands are init, check, dev, build, pack and unpack.",
        );
    }
  } catch (error) {
    if (!isExpected(error)) throw error;
    io.err(`slides: ${error.message}`);
    if (error instanceof UsageError || error instanceof TypeError) io.err("See slides --help.");
    return 2;
  }
}

/** What can go wrong without the tool being broken: it is said in one line, without a trace. */
function isExpected(error: unknown): error is Error {
  return (
    error instanceof UsageError ||
    error instanceof DeckReadError ||
    error instanceof DeckWriteError ||
    error instanceof TemplateError ||
    error instanceof KitError ||
    error instanceof PackageError ||
    error instanceof BrowserUnavailableError ||
    error instanceof DeckNotReadyError ||
    // What parseArgs throws for a flag it does not know.
    (error instanceof TypeError && "code" in error)
  );
}
