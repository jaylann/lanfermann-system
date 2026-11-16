"use client";

import { type ComponentProps, createContext, useContext } from "react";

export type GroundName = "paper" | "tint" | "ink" | "indigo";

const GroundContext = createContext<GroundName | undefined>(undefined);

export type GroundProps = ComponentProps<"div"> & {
  /** Who is speaking: Paper is evidence, Tint someone else's words, Ink the claim, Indigo the ask. */
  ground: GroundName;
};

/**
 * Switches a region to another ground. A plain `data-theme` attribute does the same for
 * everything rendered inside it, but popups (menus, selects, popovers) are portalled to `<body>`
 * and would fall back to the page's ground. `Ground` also tells them which ground they were
 * opened from.
 *
 * For the page as a whole, set `data-theme` on `<html>` instead: nothing is nested there.
 */
export function Ground({ ground, ...props }: GroundProps) {
  return (
    <GroundContext value={ground}>
      <div data-slot="ground" data-theme={ground} {...props} />
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
