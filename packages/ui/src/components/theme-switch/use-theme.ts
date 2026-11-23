"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  applyMode,
  type ColorMode,
  readStoredTheme,
  resolveMode,
  storeTheme,
  systemIsDark,
  type Theme,
  THEME_STORAGE_KEY,
  type ThemeTransition,
  watchSystem,
} from "./theme-mode";

type Snapshot = { theme: Theme; mode: ColorMode };

/*
 * One store for the page, so every `useTheme` (a switch in the bar, another on the settings page)
 * shows the same choice. It listens to the system's setting and to other tabs while anything
 * reads it.
 */
const SERVER: Snapshot = { theme: "system", mode: "light" };
const listeners = new Set<() => void>();
let current: Snapshot | undefined;
let stopWatching: (() => void) | undefined;
/** The choice made on this page, for a browser that refuses storage. */
let chosen: Theme | undefined;

function read(): Snapshot {
  const theme = readStoredTheme() ?? chosen ?? "system";
  return { theme, mode: resolveMode(theme, systemIsDark()) };
}

function refresh() {
  const next = read();
  if (current?.theme === next.theme && current.mode === next.mode) return;
  current = next;
  for (const listener of listeners) listener();
}

/** A change from outside: the system's setting turned, or another tab chose. */
function onOutsideChange() {
  refresh();
  if (current) applyMode(current.mode);
}

function onStorage(event: StorageEvent) {
  if (event.key === null || event.key === THEME_STORAGE_KEY) onOutsideChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stopWatching) {
    const stopSystem = watchSystem(onOutsideChange);
    window.addEventListener("storage", onStorage);
    stopWatching = () => {
      stopSystem();
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopWatching?.();
      stopWatching = undefined;
    }
  };
}

function getSnapshot(): Snapshot {
  current ??= read();
  return current;
}

export type UseThemeOptions = {
  /**
   * How the page changes when `setTheme` is called: by a short fade of the old page into the new
   * one (the default, where the browser can and the reader has not asked for less motion), or at
   * once.
   */
  transition?: ThemeTransition;
};

export type UseThemeResult = {
  /** The reader's choice: as the system says, light, or dark. "system" until one is stored. */
  theme: Theme;
  /** What the page shows. Light on the server and in the first render; then the real one. */
  mode: ColorMode;
  /** Chooses, keeps the choice for the next visit, and turns the page. */
  setTheme: (theme: Theme) => void;
};

/**
 * The reader's choice of light or dark, and the page's mode. Pair it with `ThemeSwitch` for the
 * control and with `ThemeScript` in the <head>, which sets the mode before the first paint:
 *
 *   const { theme, setTheme } = useTheme();
 *   <ThemeSwitch value={theme} onValueChange={setTheme} />
 *
 * The choice is kept in `localStorage` and in a cookie (`lf-theme`); "system" follows the
 * system's setting while the page is open. Every `useTheme` on a page shares one choice, and a
 * choice made in another tab turns this one too. It turns the page only when the choice or the
 * system's setting changes: on load that is `ThemeScript`'s, before React runs.
 */
export function useTheme({ transition = "fade" }: UseThemeOptions = {}): UseThemeResult {
  const { theme, mode } = useSyncExternalStore(subscribe, getSnapshot, () => SERVER);

  const setTheme = useCallback(
    (next: Theme) => {
      chosen = next;
      storeTheme(next);
      refresh();
      applyMode(getSnapshot().mode, transition);
    },
    [transition],
  );

  return { theme, mode, setTheme };
}
