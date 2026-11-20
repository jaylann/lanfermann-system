"use client";

import { type ComponentProps, useCallback, useEffect, useId, useMemo, useState } from "react";

import { useShortcut } from "@/components/shortcut/shortcut";
import {
  SIDEBAR_WIDE,
  type SidebarState,
  SidebarStateContext,
} from "@/components/sidebar/sidebar-context";
import { cn } from "@/lib/cn";

export type AppShellProps = ComponentProps<"div"> & {
  /** Whether the sidebar is open (controlled). */
  sidebarOpen?: boolean;
  /** Whether the sidebar is open at first. Open unless said otherwise. */
  defaultSidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  /**
   * The shortcut that collapses and expands the sidebar, written like the `keys` of a
   * `Shortcut`. `false` for none.
   */
  sidebarShortcut?: string | false;
};

/**
 * The frame of an app: the `Sidebar` on the left, the page beside it. Put the sidebar first,
 * then an `AppShellPage` with the page's `AppShellBar` and its `AppShellMain`.
 *
 * The shell keeps whether the sidebar is open, so the `SidebarTrigger` in the bar and the
 * sidebar agree. To have the sidebar come back the way it was left, keep the state yourself
 * (`sidebarOpen`, `onSidebarOpenChange`) in a cookie and hand it in on the server: the page
 * then arrives with the sidebar at its width, and nothing moves on load.
 */
export function AppShell({
  sidebarOpen,
  defaultSidebarOpen = true,
  onSidebarOpenChange,
  sidebarShortcut = "mod+b",
  className,
  ...props
}: AppShellProps) {
  const id = useId();
  const [kept, setKept] = useState(defaultSidebarOpen);
  const open = sidebarOpen ?? kept;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const setOpen = useCallback(
    (next: boolean) => {
      setKept(next);
      onSidebarOpenChange?.(next);
    },
    [onSidebarOpenChange],
  );

  const toggle = useCallback(() => {
    if (window.matchMedia(SIDEBAR_WIDE).matches) setOpen(!open);
    else setDrawerOpen((shown) => !shown);
  }, [open, setOpen]);

  useShortcut(sidebarShortcut || "mod+b", toggle, { enabled: sidebarShortcut !== false });

  // A window that grows wide has the sidebar beside the page again: the drawer is not needed.
  useEffect(() => {
    const query = window.matchMedia(SIDEBAR_WIDE);
    const widened = () => {
      if (query.matches) setDrawerOpen(false);
    };
    query.addEventListener("change", widened);
    return () => query.removeEventListener("change", widened);
  }, []);

  const state = useMemo<SidebarState>(
    () => ({ open, setOpen, drawerOpen, setDrawerOpen, toggle, id, shortcut: sidebarShortcut }),
    [open, setOpen, drawerOpen, toggle, id, sidebarShortcut],
  );

  return (
    <SidebarStateContext value={state}>
      <div
        data-slot="app-shell"
        data-sidebar={open ? "expanded" : "collapsed"}
        className={cn("flex min-h-dvh", className)}
        {...props}
      />
    </SidebarStateContext>
  );
}

/** Everything beside the sidebar: the page's bar and its content, one under the other. */
export function AppShellPage({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-page"
      className={cn("flex min-w-0 flex-1 flex-col", className)}
      {...props}
    />
  );
}

/**
 * The bar across the top of the page: the `SidebarTrigger`, where one is (`Breadcrumbs`), and
 * what can be done from everywhere (the search). It stays in view while the page scrolls. What
 * belongs to one page only (its title, its actions) stands in the page, not here.
 */
export function AppShellBar({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      data-slot="app-shell-bar"
      className={cn(
        "sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-hairline bg-ground px-3",
        className,
      )}
      {...props}
    />
  );
}

/** The page itself. It is the page's `<main>`; give it an id for the skip link. */
export function AppShellMain({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      data-slot="app-shell-main"
      className={cn("min-w-0 flex-1 px-4 py-6 sm:px-6", className)}
      {...props}
    />
  );
}
