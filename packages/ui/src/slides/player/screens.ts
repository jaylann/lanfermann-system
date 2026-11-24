/**
 * Puts the audience's window on the projector, where the browser can say which screens there are
 * (the Window Management API: Chromium on a desktop, after the presenter allows it). Everywhere
 * else the window is dragged across by hand.
 */

/** The part of a `ScreenDetailed` that is used here. */
type ScreenPlace = {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
};

type ScreenDetails = {
  screens: readonly ScreenPlace[];
  currentScreen: ScreenPlace;
};

type WithScreenDetails = { getScreenDetails: () => Promise<ScreenDetails> };

function hasScreenDetails(target: object): target is WithScreenDetails {
  return "getScreenDetails" in target && typeof target.getScreenDetails === "function";
}

/**
 * Moves `popup` onto a screen other than the one this window is on, and fills it. Resolves to
 * whether it did: false where the API is missing, where the presenter refused the permission, and
 * where there is one screen only.
 */
export async function placeOnOtherScreen(popup: Window): Promise<boolean> {
  if (!hasScreenDetails(window)) return false;
  let details: ScreenDetails;
  try {
    details = await window.getScreenDetails();
  } catch (error) {
    // Refused, or not allowed in this frame: the window stays where the browser opened it.
    if (error instanceof DOMException) return false;
    throw error;
  }
  const other = details.screens.find((screen) => screen !== details.currentScreen);
  if (!other || popup.closed) return false;
  popup.moveTo(other.availLeft, other.availTop);
  popup.resizeTo(other.availWidth, other.availHeight);
  return true;
}
