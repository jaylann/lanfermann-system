"use client";

import { createContext, useSyncExternalStore } from "react";

/**
 * Whether the sidebar is open, kept by the `AppShell` so that a `SidebarTrigger` in the page's
 * bar and the `Sidebar` beside it agree. A sidebar outside a shell has none and simply stands.
 */
export type SidebarState = {
  /** At full width on a wide window. Collapsed otherwise. */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** The drawer that holds the sidebar on a narrow window. */
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  /** Collapses or expands on a wide window, opens or closes the drawer on a narrow one. */
  toggle: () => void;
  /** The id of the sidebar's element, for the trigger's `aria-controls`. */
  id: string;
  /** The shortcut that toggles it, as `Shortcut` writes one, or `false` for none. */
  shortcut: string | false;
};

export const SidebarStateContext = createContext<SidebarState | null>(null);

/** From this width on the sidebar stands beside the page (Tailwind's `md`). */
export const SIDEBAR_WIDE = "(min-width: 48rem)";

function subscribe(notify: () => void) {
  const query = window.matchMedia(SIDEBAR_WIDE);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

/** Whether the window is wide enough for the sidebar to stand beside the page. Yes on the server. */
export function useWideWindow(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(SIDEBAR_WIDE).matches,
    () => true,
  );
}
