"use client";

import { type ComponentProps, createContext, useContext } from "react";

export type GroundName = "paper" | "tint" | "ink" | "indigo";

/** How light the room is, where a region says so itself instead of following the page. */
export type GroundMode = "light" | "dark";

const GroundContext = createContext<GroundName | undefined>(undefined);
const GroundModeContext = createContext<GroundMode | undefined>(undefined);

export type GroundProps = ComponentProps<"div"> & {
  /** Who is speaking: Paper is evidence, Tint someone else's words, Ink the claim, Indigo the ask. */
  ground: GroundName;
  /**
   * Fixes the region's mode whatever the page's is: `light` keeps it light on a dark page, `dark`
   * makes it dark on a light one. For showing both modes at once, as the thumbnails of an
   * appearance setting do; a page follows `data-mode` on `<html>` and sets none. One level: a
   * scope inside another scope keeps the outer one's mode.
   */
  mode?: GroundMode;
};

/**
 * Switches a region to another ground. A plain `data-theme` attribute does the same for
 * everything rendered inside it, but popups (menus, selects, popovers) are portalled to `<body>`
 * and would fall back to the page's ground. `Ground` also tells them which ground they were
 * opened from.
 *
 * For the page as a whole, set `data-theme` on `<html>` instead: nothing is nested there.
 */
export function Ground({ ground, mode, ...props }: GroundProps) {
  const outer = useContext(GroundModeContext);
  return (
    <GroundContext value={ground}>
      <GroundModeContext value={mode ?? outer}>
        <div data-slot="ground" data-theme={ground} data-mode={mode} {...props} />
      </GroundModeContext>
    </GroundContext>
  );
}

/**
 * The ground of the nearest `Ground`, or `undefined` on the page's own ground. Popup parts put it
 * on their popup as `data-theme`, so a sheet opened on Ink is an Ink sheet.
 */
export function useGround(): GroundName | undefined {
  return useContext(GroundContext);
}

/**
 * The mode a `Ground` around fixed, or `undefined` where the page's own mode applies. Popup parts
 * put it on their popup as `data-mode` beside `data-theme`: a sheet is portalled to `<body>`, and
 * one opened inside a light scope on a dark page would otherwise come out dark.
 */
export function useGroundMode(): GroundMode | undefined {
  return useContext(GroundModeContext);
}
