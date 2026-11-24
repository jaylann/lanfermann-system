import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

/**
 * The prebuilt player of `@lanfermann/ui`, as the install holds it: the script, the styles and
 * the fonts that make a deck one file, and the class names a deck may use.
 */
export type Kit = {
  /** The version of `@lanfermann/ui`. */
  version: string;
  /** `player.global.js`: React, the slide parts and the player, as one script. */
  script: string;
  /** `player.css`: the styles of the parts and of the player. */
  css: string;
  /** `fonts.inline.css`: the kit's faces as data URLs. */
  fonts: string;
  /** `NOTICES.txt`: what is inside from others. A built file carries it. */
  notices: string;
  /** `classes.json`: the class names `player.css` defines. */
  classes: readonly string[];
};

/** The install has no usable player: the kit is not built, too old, or damaged. */
export class KitError extends Error {
  override readonly name = "KitError";
}

const MANIFEST = "@lanfermann/ui/slides/player/manifest.json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

type Manifest = { dir: string; version: string; files: Record<string, unknown> };

let manifest: Manifest | undefined;
let kit: Kit | undefined;

/**
 * The player's manifest, found from this package's own place, so it is the same player whether
 * the tool runs from a project, globally or through `bunx`.
 */
function readManifest(): Manifest {
  if (manifest) return manifest;
  const require = createRequire(import.meta.url);
  let path: string;
  try {
    path = require.resolve(MANIFEST);
  } catch (cause) {
    throw new KitError(
      "The prebuilt player of @lanfermann/ui was not found. In this repository, build the kit " +
        "first (bun run --filter @lanfermann/ui build); elsewhere, install a version of " +
        "@lanfermann/ui that ships slides/player.",
      { cause },
    );
  }
  const json: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!isRecord(json) || typeof json.version !== "string" || !isRecord(json.files)) {
    throw new KitError("The player's manifest.json is not in the form this tool reads.");
  }
  manifest = { dir: dirname(path), version: json.version, files: json.files };
  return manifest;
}

/** The version of the installed `@lanfermann/ui`: the player a bundle made now needs. */
export function kitVersion(): string {
  return readManifest().version;
}

/**
 * Reads the player from the installed `@lanfermann/ui`. Every file is compared with the hash in
 * the player's manifest. Read once per process.
 */
export function loadKit(): Kit {
  if (kit) return kit;
  const { dir, version, files } = readManifest();
  const read = (name: string): string => {
    const entry = files[name];
    let data: Buffer;
    try {
      data = readFileSync(join(dir, name));
    } catch (cause) {
      throw new KitError(
        `The player's ${name} is missing. Build or install @lanfermann/ui again.`,
        {
          cause,
        },
      );
    }
    const hash = createHash("sha256").update(data).digest("hex");
    if (!isRecord(entry) || entry.sha256 !== hash) {
      throw new KitError(
        `The player's ${name} does not match its manifest. Build or install @lanfermann/ui again.`,
      );
    }
    return data.toString("utf8");
  };
  const classes: unknown = JSON.parse(read("classes.json"));
  if (!isStringList(classes)) {
    throw new KitError("The player's classes.json is not a list of class names.");
  }
  kit = {
    version,
    script: read("player.global.js"),
    css: read("player.css"),
    fonts: read("fonts.inline.css"),
    notices: read("NOTICES.txt"),
    classes,
  };
  return kit;
}
