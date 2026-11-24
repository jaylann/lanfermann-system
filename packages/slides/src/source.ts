import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { join } from "node:path";

import type { DeckSource } from "./types";

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

function hasControlCharacter(text: string): boolean {
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
