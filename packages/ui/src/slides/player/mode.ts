/**
 * What a page's address may ask of the player. Pure: the address is read here and nowhere else.
 */

/** How a deck is shown. */
export type PlayerMode = "audience" | "presenter" | "print" | "check";

const MODES: readonly string[] = ["audience", "presenter", "print", "check"] satisfies PlayerMode[];

function isMode(value: string | null): value is PlayerMode {
  return value !== null && MODES.includes(value);
}

/**
 * The mode a page opens in: `?mode=` in its address if the build allows that mode, the build's
 * own mode otherwise. The build's own mode is always allowed. So a file made for an audience
 * cannot be talked into the presenter's console, whose notes it does not hold anyway.
 */
export function modeFromSearch(
  search: string,
  fallback: PlayerMode,
  allowed: readonly PlayerMode[],
): PlayerMode {
  const asked = new URLSearchParams(search).get("mode");
  return isMode(asked) && allowed.includes(asked) ? asked : fallback;
}

/**
 * The session `?session=` names, for an audience's window opened by a presenter's, or `undefined`:
 * the name is one this player made (letters, digits, dashes), or it is not used.
 */
export function sessionFromSearch(search: string): string | undefined {
  const asked = new URLSearchParams(search).get("session");
  return asked !== null && /^[\w-]{1,64}$/.test(asked) ? asked : undefined;
}
