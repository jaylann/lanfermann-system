/**
 * Deep links. A slide's address is its page in the hash, `#/7`; a slide's `id` works too,
 * `#/befunde`, and survives a slide being added before it.
 */

/** The slide a hash names, counted from 0, or `undefined` when it names none. */
export function slideFromHash(
  hash: string,
  ids: readonly (string | undefined)[],
): number | undefined {
  const match = /^#\/(.+)$/.exec(hash);
  if (!match?.[1]) return undefined;
  const name = decodeURIComponent(match[1]);
  const byId = ids.indexOf(name);
  if (byId !== -1) return byId;
  if (!/^\d+$/.test(name)) return undefined;
  const page = Number(name);
  return page >= 1 && page <= ids.length ? page - 1 : undefined;
}

/** The hash of a slide: its page, counted from 1. */
export function hashOfSlide(index: number): string {
  return `#/${index + 1}`;
}
