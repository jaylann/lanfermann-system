import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe } from "vitest";

import { readDeckDir } from "./source";
import type { DeckInput, DeckSource } from "./types";

/** What only the tests of this package use. */

/** The folder of a fixture deck: `fixtures/<name>`. */
export function fixturePath(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));
}

export function fixture(name: string): Promise<DeckSource> {
  return readDeckDir(fixturePath(name));
}

/** A deck of one file, for a test that is about one line of it. */
export function deckOf(code: string, more: Record<string, string> = {}): DeckInput {
  return { entry: "deck.tsx", files: { "deck.tsx": code, ...more } };
}

/** The opening of a deck file that needs nothing but the usual parts. */
export const HEAD = 'import { Deck, Slide, Title } from "@lanfermann/ui/slides";\n';

/** A whole deck around the given slides. */
export function deckWith(slides: string, before = ""): DeckInput {
  return deckOf(
    `${HEAD}${before}\nexport default (\n  <Deck title="Probe">\n${slides}\n  </Deck>\n);\n`,
  );
}

const player = fileURLToPath(new URL("../../ui/player/manifest.json", import.meta.url));
const types = fileURLToPath(new URL("../../ui/dist/slides/index.d.ts", import.meta.url));

/** Whether `@lanfermann/ui` is built: its prebuilt player and its declarations are there. */
export const kitBuilt = existsSync(player) && existsSync(types);

if (!kitBuilt) {
  console.warn(
    "SKIPPED: the tests that need the kit's prebuilt player (packages/ui/player/manifest.json) " +
      "do not run. Build it first: bun run --filter @lanfermann/ui build",
  );
}

/**
 * `describe` for tests that bundle, type-check or build a deck: they need the kit's `player/`
 * and `dist/`, which a build writes and git does not hold. Without them they are skipped, with
 * the line above saying why.
 */
export const describeWithKit = describe.skipIf(!kitBuilt);
