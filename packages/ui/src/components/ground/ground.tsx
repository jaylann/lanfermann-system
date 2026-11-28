"use client";

import { type ComponentProps, createContext, type CSSProperties, useContext } from "react";

export type GroundName = "paper" | "tint" | "ink" | "indigo";

const GroundContext = createContext<GroundName | undefined>(undefined);

export type GroundProps = ComponentProps<"div"> & {
  /** Who is speaking: Paper is evidence, Tint someone else's words, Ink the claim, Indigo the ask. */
  ground: GroundName;
  /**
   * Paints the region in a colour that is not the kit's: a brand's own ground. Any CSS colour.
   * Give it together with `foreground`; `ground` then names the kit ground it is nearest to
   * (`paper` for a light one, `ink` for a dark one), whose depth, status colours and popups it
   * keeps.
   */
  background?: string;
  /**
   * The text colour on `background`. Body and muted text, lines, washes and the focus ring are
   * mixed from the two, so keep them well apart (7:1 or more) for muted text to stay readable.
   */
  foreground?: string;
  /** The brand's accent on that ground: links, the focus ring. The foreground when left out. */
  accent?: string;
};

/**
 * Switches a region to another ground. A plain `data-theme` attribute does the same for
 * everything rendered inside it, but popups (menus, selects, popovers) are portalled to `<body>`
 * and would fall back to the page's ground. `Ground` also tells them which ground they were
 * opened from.
 *
 * For the page as a whole, set `data-theme` on `<html>` instead: nothing is nested there.
 *
 * With `background` and `foreground` it is a ground in colours of its own (a customer's brand
 * behind a preview of their page, their QR code, their mail): text, lines and the focus ring are
 * derived from the two as for the kit's grounds. It is for showing someone else's colours, not
 * for a fifth ground of an app. Its shadows, edges and status colours are those of `ground`,
 * which follows the page's mode: name the ground that fits the colours in the mode they are
 * shown in.
 */
export function Ground({ ground, background, foreground, accent, style, ...props }: GroundProps) {
  const custom = background !== undefined && foreground !== undefined;
  const colours = custom
    ? ({
        "--ground-background": background,
        "--ground-foreground": foreground,
        "--ground-accent": accent,
      } as CSSProperties)
    : undefined;
  return (
    <GroundContext value={ground}>
      <div
        data-slot="ground"
        data-theme={ground}
        data-ground-custom={custom ? "" : undefined}
        style={colours ? { ...colours, ...style } : style}
        {...props}
      />
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
