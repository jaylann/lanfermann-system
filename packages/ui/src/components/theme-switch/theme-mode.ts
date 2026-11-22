/*
 * The page's mode (light or dark) and how a reader's choice of it is kept. No hooks here, so a
 * Server Component may import it: `ThemeScript` renders the script below into the <head>, and
 * `useTheme` (use-theme.ts) changes the mode afterwards.
 *
 * The contract with the stylesheet: `data-mode="dark"` on <html> turns every ground dark
 * (grounds.css); without it, or with `light`, the page is light. CSS knows only the resolved mode:
 * "as the system says" is resolved here, in JavaScript, before the first paint.
 */

/** How a site should look: as the system says, light, or dark. */
export type Theme = "system" | "light" | "dark";

/** What the page shows: the resolved theme. */
export type ColorMode = "light" | "dark";

/**
 * Where the reader's choice is kept: in `localStorage` for the script that runs before the first
 * paint, and in a cookie of the same name, so a server can render `data-mode` itself.
 */
export const THEME_STORAGE_KEY = "lf-theme";

/** The attribute on <html> the stylesheet reads. */
export const MODE_ATTRIBUTE = "data-mode";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

/** The mode a choice comes to, given whether the system is set to dark. */
export function resolveMode(theme: Theme, systemIsDark: boolean): ColorMode {
  if (theme === "system") return systemIsDark ? "dark" : "light";
  return theme;
}

/**
 * The script that sets the mode before the first paint: the stored choice (or "system"),
 * resolved against the system's setting. Inline, dependency-free and wrapped in try/catch: a
 * browser that refuses storage still gets the system's mode.
 */
export const themeScript = `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}if(t!=="light"&&t!=="dark")t=window.matchMedia&&matchMedia(${JSON.stringify(
  DARK_QUERY,
)}).matches?"dark":"light";document.documentElement.setAttribute(${JSON.stringify(
  MODE_ATTRIBUTE,
)},t)})()`;

export function systemIsDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;
}

export function watchSystem(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function readStoredTheme(): Theme | undefined {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

/** Keeps the choice for the next visit: in storage for the script, in a cookie for a server. */
export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage refused (a private window, a full quota): the choice holds for this page only.
  }
  // A year, on the whole site. A choice the reader made is a setting, not tracking.
  document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * How the page changes when the reader switches:
 *   instant  the page turns at once; a control that is mid-transition keeps its own spring.
 *   fade     the old page fades into the new one (a view transition), where the browser can and
 *            the reader has not asked for less motion; elsewhere it is instant.
 */
export type ThemeTransition = "instant" | "fade";

/** Sets the mode on <html>. A change the reader did not make (another tab, the system) is instant. */
export function applyMode(mode: ColorMode, transition: ThemeTransition = "instant"): void {
  const root = document.documentElement;
  if (root.getAttribute(MODE_ATTRIBUTE) === mode) return;
  const commit = () => root.setAttribute(MODE_ATTRIBUTE, mode);
  const fade =
    transition === "fade" &&
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fade) {
    commit();
    return;
  }
  // The attribute scopes the fade's timing (motion.css) to this one transition.
  root.setAttribute("data-mode-switch", "");
  const switching = document.startViewTransition(commit);
  void switching.finished.finally(() => root.removeAttribute("data-mode-switch"));
}
