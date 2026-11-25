import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";

import type { SlideGround } from "@/slides/slide/slide";

/** One slide of a deck, as `Deck` and a player lay it out. */
export type SlideEntry = {
  /** Stable within the deck: the element's own key, or its position. */
  key: string;
  element: ReactElement;
  /** What the element was given, where it was used. A player reads the notes from here. */
  id?: string;
  notes?: ReactNode;
  ground?: SlideGround;
};

type SlideLikeProps = {
  id?: string;
  notes?: ReactNode;
  ground?: SlideGround;
  children?: ReactNode;
};

/**
 * The slides of a deck, in order: every top-level child of `Deck` is one slide, with fragments and
 * arrays opened up. Text and empty children between slides are dropped.
 *
 * `id`, `notes` and `ground` are read from the element's own props, so a deck's wrapper around
 * `Slide` has to take them where it is used: `<Aufgabe id="aufgabe" notes="…" />`.
 */
export function flattenSlides(children: ReactNode): SlideEntry[] {
  const entries: SlideEntry[] = [];
  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement<SlideLikeProps>(child)) return;
      if (child.type === Fragment) {
        visit(child.props.children);
        return;
      }
      const { id, notes, ground } = child.props;
      entries.push({
        key: child.key ?? `slide-${entries.length}`,
        element: child,
        id,
        notes,
        ground,
      });
    });
  };
  visit(children);
  return entries;
}
