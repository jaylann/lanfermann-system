/**
 * Deep links. A slide's address is its page in the hash, `#/7`; a slide's `id` works too,
 * `#/befunde`, and survives a slide being added before it. A step of the slide follows after a
 * dot: `#/7.1` is page 7 at step 1, `#/befunde.2` that slide at step 2; without one it is step 0.
 *
 * The step is the last `.` and digits of the address, so an id may hold a dot only where it does
 * not end in a dot and digits (`v1.2` reads as the slide `v1` at step 2).
 */

/** A place in the deck: the slide, counted from 0, and its step. */
export type Address = { index: number; step: number };

/** What an address names, before it is looked up: an id or a page, and the step. */
function split(hash: string): { name: string; step: number } | undefined {
  const match = /^#\/(.+)$/.exec(hash);
  if (!match?.[1]) return undefined;
  let decoded: string;
  try {
    decoded = decodeURIComponent(match[1]);
  } catch (error) {
    // A broken escape (`%E0%A4`) names no slide; anything else is a real error.
    if (error instanceof URIError) return undefined;
    throw error;
  }
  const stepped = /^(.+)\.(\d+)$/.exec(decoded);
  if (!stepped?.[1] || stepped[2] === undefined) return { name: decoded, step: 0 };
  return { name: stepped[1], step: Number(stepped[2]) };
}

/** The slide a name stands for: an id first, then a page counted from 1. */
function lookUp(name: string, ids: readonly (string | undefined)[]): number | undefined {
  const byId = ids.indexOf(name);
  if (byId !== -1) return byId;
  if (!/^\d+$/.test(name)) return undefined;
  const page = Number(name);
  return page >= 1 && page <= ids.length ? page - 1 : undefined;
}

/**
 * The slide and step a hash names, or `undefined` when it names no slide. The step is taken as
 * written; the player clamps it to the slide's steps.
 */
export function addressFromHash(
  hash: string,
  ids: readonly (string | undefined)[],
): Address | undefined {
  const parts = split(hash);
  if (!parts) return undefined;
  const index = lookUp(parts.name, ids);
  return index === undefined ? undefined : { index, step: parts.step };
}

/** The hash of a slide: its page, counted from 1, and its step after a dot when it is not 0. */
export function hashOfSlide(index: number, step = 0): string {
  return `#/${index + 1}${step > 0 ? `.${step}` : ""}`;
}

/**
 * The hash to write when the deck stands at `index` and `step` and the address says `current`,
 * or `undefined` when the address already says that.
 *
 * An id in the address stays while it names this slide: it is the better link. When only the step
 * changed it keeps the id and takes the new step (`#/befunde` becomes `#/befunde.2`); on another
 * slide the address becomes that slide's page.
 */
export function hashToWrite(
  current: string,
  ids: readonly (string | undefined)[],
  index: number,
  step: number,
): string | undefined {
  const parts = split(current);
  const named = parts && lookUp(parts.name, ids);
  if (named !== index || !parts) return hashOfSlide(index, step);
  if (parts.step === step) return undefined;
  if (ids[index] !== parts.name) return hashOfSlide(index, step);
  return `#/${encodeURIComponent(parts.name)}${step > 0 ? `.${step}` : ""}`;
}
