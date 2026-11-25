import { createHash } from "node:crypto";

import { analyzeDeck } from "./analyze";
import { kitVersion } from "./kit";
import {
  DECK_ENTRY,
  isDeckPath,
  kindOf,
  MAX_DECK_FILES,
  MAX_DECK_IMAGE_BYTES,
  MAX_IMAGE_BYTES,
} from "./source";
import type { DeckSource } from "./types";
import { version } from "./version";

export const PACKAGE_FORMAT = "lanfermann.deck";
export const PACKAGE_VERSION = 1;

/** One file of a package: code as text, a picture as base64. */
export type PackedFile = {
  path: string;
  encoding: "utf8" | "base64";
  /** Of the file's bytes, in hex. */
  sha256: string;
  bytes: number;
  content: string;
};

export type DeckManifest = {
  title: string;
  /** What the deck is called in an address: lower case, digits and hyphens. */
  slug: string;
  lang: string;
  /** The version of `@lanfermann/ui` the deck was packed against. */
  kit: string;
  /** How many slides the source names. */
  slides: number;
  /** `@lanfermann/slides <version>` */
  createdWith: string;
};

/**
 * A deck as one JSON document, for the hub: its source files and a manifest. It holds no time
 * and no path of the machine, and its files are in order, so the same deck packs to the same
 * bytes.
 */
export type DeckPackage = {
  format: typeof PACKAGE_FORMAT;
  version: typeof PACKAGE_VERSION;
  manifest: DeckManifest;
  files: PackedFile[];
};

/** A package that is not in the form this tool writes. The message says what is wrong. */
export class PackageError extends Error {
  override readonly name = "PackageError";
}

const UMLAUTS: Readonly<Record<string, string>> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * A title as a name for a file and an address: lower case, the German umlauts written out
 * (ä is ae, ß is ss), other accents dropped, and everything else that is no letter or digit
 * as one hyphen. A title without any letter or digit is `deck`.
 */
export function slugOf(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[äöüß]/g, (letter) => UMLAUTS[letter] ?? letter)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "" ? "deck" : slug;
}

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const byPath = (a: { path: string }, b: { path: string }) =>
  a.path < b.path ? -1 : a.path > b.path ? 1 : 0;

/**
 * Packs a deck for the hub. The title and the language are read from the source; `slug`
 * replaces the name made from the title. The deck is not checked here: pack what `checkDeck`
 * has passed.
 */
export function packDeck(source: DeckSource, options: { slug?: string } = {}): DeckPackage {
  const analysis = analyzeDeck(source);
  const title = analysis.title ?? "";
  if (title === "") {
    throw new PackageError(
      "The deck has no title that is written out, so the package cannot be named.",
    );
  }
  const slug = options.slug ?? slugOf(title);
  if (!SLUG.test(slug)) {
    throw new PackageError("A slug is made of lower-case letters, digits and single hyphens.");
  }
  const files: PackedFile[] = [];
  for (const [path, text] of Object.entries(source.files)) {
    const bytes = Buffer.from(text, "utf8");
    files.push({
      path,
      encoding: "utf8",
      sha256: sha256(bytes),
      bytes: bytes.byteLength,
      content: text,
    });
  }
  for (const [path, bytes] of Object.entries(source.images)) {
    files.push({
      path,
      encoding: "base64",
      sha256: sha256(bytes),
      bytes: bytes.byteLength,
      content: Buffer.from(bytes).toString("base64"),
    });
  }
  return {
    format: PACKAGE_FORMAT,
    version: PACKAGE_VERSION,
    manifest: {
      title,
      slug,
      lang: analysis.lang ?? "de",
      kit: kitVersion(),
      slides: analysis.slides.length,
      createdWith: `@lanfermann/slides ${version}`,
    },
    files: files.sort(byPath),
  };
}

/** A package as the text of its file: the same package gives the same bytes. */
export function serializePackage(deck: DeckPackage): string {
  return `${JSON.stringify(deck, null, 2)}\n`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function manifestOf(value: unknown): DeckManifest {
  if (!isRecord(value)) throw new PackageError("The package has no manifest.");
  const { title, slug, lang, kit, slides, createdWith } = value;
  if (typeof title !== "string" || title.trim() === "") {
    throw new PackageError("The manifest has no title.");
  }
  if (typeof slug !== "string" || slug.length > 200 || !SLUG.test(slug)) {
    throw new PackageError(
      "The manifest's slug is not made of lower-case letters, digits and single hyphens.",
    );
  }
  if (typeof lang !== "string" || !/^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$/.test(lang)) {
    throw new PackageError("The manifest's lang is not a language tag.");
  }
  if (typeof kit !== "string" || kit === "") {
    throw new PackageError("The manifest does not name the kit's version.");
  }
  if (typeof slides !== "number" || !Number.isInteger(slides) || slides < 0) {
    throw new PackageError("The manifest's count of slides is not a whole number.");
  }
  if (typeof createdWith !== "string") {
    throw new PackageError("The manifest does not say what the package was created with.");
  }
  return { title, slug, lang, kit, slides, createdWith };
}

/**
 * Reads a package back into a deck, and trusts nothing in it: the format and its version,
 * every path (relative, forward slashes, no step up, a kind a deck holds, named once), every
 * file's size and hash, the weight of the pictures, and that the entry is there. Throws a
 * `PackageError` that says what is wrong, by the file's position in the list and never by
 * text from the package.
 */
export function parsePackage(json: string): DeckSource & { manifest: DeckManifest } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    throw new PackageError("The package is not JSON.", { cause });
  }
  if (!isRecord(parsed) || parsed.format !== PACKAGE_FORMAT) {
    throw new PackageError(`The file is not a deck package (format "${PACKAGE_FORMAT}").`);
  }
  if (parsed.version !== PACKAGE_VERSION) {
    throw new PackageError(
      `The package is of a version this tool does not read (it reads ${PACKAGE_VERSION}).`,
    );
  }
  const manifest = manifestOf(parsed.manifest);
  if (!Array.isArray(parsed.files)) throw new PackageError("The package has no list of files.");
  if (parsed.files.length > MAX_DECK_FILES) {
    throw new PackageError(`The package holds more than ${MAX_DECK_FILES} files.`);
  }

  const files: Record<string, string> = {};
  const images: Record<string, Uint8Array> = {};
  const seen = new Set<string>();
  let weight = 0;
  parsed.files.forEach((file: unknown, index) => {
    const where = `files[${index}]`;
    if (!isRecord(file)) throw new PackageError(`${where} is not a file.`);
    const { path, encoding, sha256: hash, bytes, content } = file;
    if (typeof path !== "string" || !isDeckPath(path)) {
      throw new PackageError(
        `${where} has a path a deck's file may not have: paths are relative, with forward ` +
          "slashes, and do not step up.",
      );
    }
    if (seen.has(path)) throw new PackageError(`${where} names a path a second time.`);
    seen.add(path);
    const kind = kindOf(path);
    if (kind === undefined) {
      throw new PackageError(`${where} is of a kind a deck does not hold (.ts, .tsx, pictures).`);
    }
    if (typeof content !== "string" || typeof hash !== "string" || typeof bytes !== "number") {
      throw new PackageError(`${where} lacks its content, its hash or its size.`);
    }
    let data: Buffer;
    if (kind === "code" && encoding === "utf8") {
      data = Buffer.from(content, "utf8");
    } else if (kind === "image" && encoding === "base64" && BASE64.test(content)) {
      data = Buffer.from(content, "base64");
    } else {
      throw new PackageError(
        `${where} is not encoded as its kind asks: code as utf8, a picture as base64.`,
      );
    }
    if (data.byteLength !== bytes) throw new PackageError(`${where} is not of the size it states.`);
    if (sha256(data) !== hash) throw new PackageError(`${where} does not match its hash.`);
    if (kind === "code") {
      files[path] = content;
      return;
    }
    weight += data.byteLength;
    if (data.byteLength > MAX_IMAGE_BYTES || weight > MAX_DECK_IMAGE_BYTES) {
      throw new PackageError(
        `${where} is too heavy: a picture may weigh ${MAX_IMAGE_BYTES} bytes, all pictures of ` +
          `a deck ${MAX_DECK_IMAGE_BYTES}.`,
      );
    }
    images[path] = new Uint8Array(data);
  });
  if (!Object.hasOwn(files, DECK_ENTRY)) {
    throw new PackageError(`The package has no ${DECK_ENTRY}.`);
  }
  return { entry: DECK_ENTRY, files, images, manifest };
}
