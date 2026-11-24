import { existsSync, readFileSync } from "node:fs";

/** Reads a file of `src/slides` by its path below that folder, for the catalog. */
export function readSlideSource(path: string): string | undefined {
  const file = new URL(`../src/slides/${path}`, import.meta.url);
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}
