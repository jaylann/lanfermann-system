import { lstat, mkdir, readdir, readFile, realpath, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { type DeckSource, quote } from "./types";

/** The file whose default export is the deck. */
export const DECK_ENTRY = "deck.tsx";

/** The kinds of picture a deck may use, with the type its data URL names. */
export const IMAGE_TYPES: Readonly<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

/** The most one picture may weigh, in bytes: it ends up inside the one HTML file. */
export const MAX_IMAGE_BYTES = 2_000_000;
/** The most all pictures of a deck may weigh together, in bytes. */
export const MAX_DECK_IMAGE_BYTES = 12_000_000;
/** The most files a deck's folder may hold: a wrong folder is noticed before it is read. */
export const MAX_DECK_FILES = 2_000;

const CODE_EXTENSIONS: readonly string[] = [".ts", ".tsx"];

/** The extension of a path, in lower case and with its dot, or "" when it has none. */
export function extensionOf(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  return dot <= 0 ? "" : name.slice(dot).toLowerCase();
}

/** What a file is to a deck: its code, a picture, or nothing it can use. */
export function kindOf(path: string): "code" | "image" | undefined {
  const extension = extensionOf(path);
  if (CODE_EXTENSIONS.includes(extension)) return "code";
  return extension in IMAGE_TYPES ? "image" : undefined;
}

/**
 * Whether a path may name a file of a deck: relative, forward slashes only, no step up or in
 * place, no empty part, no drive letter, no control character.
 */
export function isDeckPath(path: string): boolean {
  if (path === "" || path.length > 512) return false;
  if (path.includes("\\") || /^[A-Za-z]:/.test(path) || hasControlCharacter(path)) return false;
  return path.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

/** Whether a text holds a character below U+0020, or DEL. */
export function hasControlCharacter(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

/**
 * The path a relative import names, seen from the file that imports it, or `undefined` when it
 * leaves the deck's folder.
 */
export function resolveInDeck(from: string, specifier: string): string | undefined {
  const parts = from.split("/").slice(0, -1);
  for (const part of specifier.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (parts.length === 0) return undefined;
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join("/");
}

export function isRelative(specifier: string): boolean {
  return /^\.\.?(\/|$)/.test(specifier);
}

/**
 * How a picture of the deck is named in its script: its path from the deck's folder, with `./`
 * in front. An import of the picture evaluates to this text, and a deck may write it by hand
 * (`src="./bilder/werkbank.png"`). `deckHtml` puts the picture's data URL in its place.
 */
export function assetKey(path: string): string {
  return `./${path}`;
}

/** A picture as the address the one file carries it under. */
export function dataUrl(path: string, bytes: Uint8Array): string {
  const type = IMAGE_TYPES[extensionOf(path)] ?? "application/octet-stream";
  return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
}

export type ImportTarget =
  | { kind: "code"; path: string }
  /** A picture, by its path inside the deck. Whether it is there is not looked at here. */
  | { kind: "image"; path: string }
  /** The path leaves the deck's folder. */
  | { kind: "outside" }
  /** No file of the deck answers to the path. */
  | { kind: "missing" }
  /** A file of a kind a deck cannot import: a stylesheet, JSON, a script. */
  | { kind: "unsupported" };

/**
 * The file of the deck a relative import means: a picture by its path, the code file as
 * written, or a module without its extension (`./parts` is `parts.ts`, `parts.tsx` or
 * `parts/index.ts[x]`). The static check and the bundler both ask here, so they cannot disagree.
 */
export function resolveImport(
  files: Readonly<Record<string, unknown>>,
  from: string,
  specifier: string,
): ImportTarget {
  const path = resolveInDeck(from, specifier);
  if (path === undefined) return { kind: "outside" };
  if (kindOf(path) === "image") return { kind: "image", path };
  const has = (candidate: string) => Object.hasOwn(files, candidate);
  if (kindOf(path) === "code" && has(path)) return { kind: "code", path };
  const base = path === "" ? "" : `${path}/`;
  const candidates = [
    ...(path === "" ? [] : CODE_EXTENSIONS.map((extension) => `${path}${extension}`)),
    ...CODE_EXTENSIONS.map((extension) => `${base}index${extension}`),
  ];
  const found = candidates.find(has);
  if (found !== undefined) return { kind: "code", path: found };
  return extensionOf(path) === "" || kindOf(path) === "code"
    ? { kind: "missing" }
    : { kind: "unsupported" };
}

/** A folder that cannot be read as a deck. */
export class DeckReadError extends Error {
  override readonly name = "DeckReadError";
}

/**
 * Reads a deck from its folder: every `.ts` and `.tsx` file and every picture in it and below
 * it. Files of other kinds, entries whose name starts with a dot and `node_modules` are left
 * out, so a folder may carry a `package.json` and a `tsconfig.json` for its editor.
 *
 * A symbolic link is refused: a deck is its own files, and a link could name any file of the
 * machine. Code has to be valid UTF-8.
 */
export async function readDeckDir(dir: string): Promise<DeckSource> {
  let root: string;
  try {
    root = await realpath(dir);
  } catch (cause) {
    throw new DeckReadError(`Cannot read the deck's folder ${JSON.stringify(dir)}.`, { cause });
  }
  if (!(await lstat(root)).isDirectory()) {
    throw new DeckReadError(`${JSON.stringify(dir)} is not a folder.`);
  }

  const files: Record<string, string> = {};
  const images: Record<string, Uint8Array> = {};
  let count = 0;
  const walk = async (folder: string, prefix: string): Promise<void> => {
    const entries = await readdir(folder, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const path = `${prefix}${entry.name}`;
      if (entry.isSymbolicLink()) {
        throw new DeckReadError(
          `${JSON.stringify(path)} is a symbolic link. A deck holds only its own files.`,
        );
      }
      if (entry.isDirectory()) {
        await walk(join(folder, entry.name), `${path}/`);
        continue;
      }
      const kind = kindOf(path);
      if (!entry.isFile() || kind === undefined) continue;
      if (!isDeckPath(path)) {
        throw new DeckReadError(`${JSON.stringify(path)} is not a name a deck's file may have.`);
      }
      count += 1;
      if (count > MAX_DECK_FILES) {
        throw new DeckReadError(
          `The folder holds more than ${MAX_DECK_FILES} files. Is it the deck's folder?`,
        );
      }
      const data = await readFile(join(folder, entry.name));
      if (kind === "code") files[path] = decode(data, path);
      else images[path] = new Uint8Array(data);
    }
  };
  await walk(root, "");
  return { entry: DECK_ENTRY, files, images };
}

function decode(data: Uint8Array, path: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(data);
  } catch (cause) {
    throw new DeckReadError(`${JSON.stringify(path)} is not valid UTF-8.`, { cause });
  }
}

/** A deck that cannot be written to a folder. The message says why. */
export class DeckWriteError extends Error {
  override readonly name = "DeckWriteError";
}

export type WriteDeckOptions = {
  /**
   * Writes into a folder that is not empty: a file of the same path is replaced, every other
   * file stays. Without it, a folder that holds anything at all is refused.
   */
  force?: boolean;
};

const hasCode = (error: unknown, code: string) =>
  error instanceof Error && "code" in error && error.code === code;

/**
 * Refuses a list of paths that cannot all be written as they are: a path a deck's file may not
 * have, a file of the wrong kind, or two paths that meet on a disk that ignores case (a Mac's),
 * as one file or as a file and a folder.
 */
function checkPaths(entries: readonly { path: string; kind: "code" | "image" }[]): void {
  const files = new Set<string>();
  const folders = new Set<string>();
  for (const { path, kind } of entries) {
    if (!isDeckPath(path) || kindOf(path) !== kind) {
      throw new DeckWriteError(
        `${quote(path)} is not a path for a deck's ${kind === "code" ? "code" : "picture"}: ` +
          "paths are relative, with forward slashes, do not step up and end in .ts, .tsx or " +
          "a picture's extension.",
      );
    }
    const key = path.toLowerCase();
    if (files.has(key)) throw new DeckWriteError(`${quote(path)} is named twice.`);
    files.add(key);
    const parts = key.split("/");
    for (let end = 1; end < parts.length; end += 1) folders.add(parts.slice(0, end).join("/"));
  }
  for (const key of files) {
    if (folders.has(key)) {
      throw new DeckWriteError(`${quote(key)} is named as a file and as a folder.`);
    }
  }
}

/**
 * The folder a file of the deck goes into, made one step at a time below `root`. A step that is
 * a symbolic link or a file is refused: `mkdir` would follow the link out of the deck's folder.
 */
async function folderIn(root: string, parts: readonly string[]): Promise<string> {
  let folder = root;
  for (const part of parts) {
    folder = join(folder, part);
    const found = await lstat(folder).catch((error: unknown) => {
      if (hasCode(error, "ENOENT")) return undefined;
      throw error;
    });
    if (found === undefined) await mkdir(folder);
    else if (!found.isDirectory()) {
      throw new DeckWriteError(
        `${quote(relative(root, folder))} is in the way: it is no folder, or a symbolic link.`,
      );
    }
  }
  return folder;
}

/**
 * Writes a deck to a folder, the inverse of `readDeckDir`: code as UTF-8 and pictures as their
 * bytes, each at its path inside the folder, which is made when it is missing. Returns the
 * paths it wrote, in order.
 *
 * Every path is checked before anything is written (see `isDeckPath`; two paths that differ in
 * case only are refused). A folder that is not empty is refused unless `force` is given; with
 * it, no file is written through a symbolic link, and none outside the folder.
 */
export async function writeDeckDir(
  dir: string,
  source: DeckSource,
  options: WriteDeckOptions = {},
): Promise<string[]> {
  const entries = [
    ...Object.entries(source.files).map(([path, content]) => ({
      path,
      kind: "code" as const,
      content,
    })),
    ...Object.entries(source.images).map(([path, content]) => ({
      path,
      kind: "image" as const,
      content,
    })),
  ].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  checkPaths(entries);

  const held = await readdir(dir).catch((error: unknown) => {
    if (hasCode(error, "ENOENT")) return [];
    if (hasCode(error, "ENOTDIR")) {
      throw new DeckWriteError(`${JSON.stringify(dir)} is a file, not a folder.`, {
        cause: error,
      });
    }
    throw new DeckWriteError(`Cannot read the folder ${JSON.stringify(dir)}.`, { cause: error });
  });
  if (held.length > 0 && options.force !== true) {
    throw new DeckWriteError(
      `The folder ${JSON.stringify(dir)} is not empty. --force writes into it and replaces ` +
        "the files of the same name.",
    );
  }
  await mkdir(dir, { recursive: true });
  const root = await realpath(dir);

  for (const { path, content } of entries) {
    const parts = path.split("/");
    const name = parts.pop() ?? path;
    const file = join(await folderIn(root, parts), name);
    const found = await lstat(file).catch((error: unknown) => {
      if (hasCode(error, "ENOENT")) return undefined;
      throw error;
    });
    if (found !== undefined && !found.isFile()) {
      throw new DeckWriteError(
        `${quote(path)} is in the way: it is a folder or a symbolic link, not a file.`,
      );
    }
    await writeFile(file, content);
  }
  return entries.map(({ path }) => path);
}
