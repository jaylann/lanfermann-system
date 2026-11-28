"use client";

import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type RefCallback,
  useMemo,
  useRef,
  useState,
} from "react";

/** `list`: one item under another. `grid`: items in rows and columns, as a `FileGrid` lays them. */
export type SelectionLayout = "list" | "grid";

/** Where an item stands on screen, for moving up and down a grid. */
export type ItemBox = { id: string; top: number; bottom: number; left: number; right: number };

/** A row of a grid is told by its top; items in it stand within this far of each other. */
const SAME_ROW = 2;

/**
 * The item above or below another in a grid, by where they stand: in the nearest row past its
 * own, the item whose middle is closest to its middle (the first of two as close). This moves
 * by the columns the grid really has, also across sections that start rows of their own and
 * rows of shorter tiles. `null` where there is no row that way.
 */
export function itemAcross(
  boxes: readonly ItemBox[],
  from: string,
  direction: "up" | "down",
): string | null {
  const start = boxes.find((box) => box.id === from);
  if (!start) return null;
  const beyond = boxes.filter((box) =>
    direction === "down" ? box.top >= start.bottom - 1 : box.bottom <= start.top + 1,
  );
  if (beyond.length === 0) return null;
  const edge =
    direction === "down"
      ? Math.min(...beyond.map((box) => box.top))
      : Math.max(...beyond.map((box) => box.top));
  const middle = (box: ItemBox) => (box.left + box.right) / 2;
  let best: ItemBox | null = null;
  for (const box of beyond) {
    if (Math.abs(box.top - edge) > SAME_ROW) continue;
    if (!best || Math.abs(middle(box) - middle(start)) < Math.abs(middle(best) - middle(start))) {
      best = box;
    }
  }
  return best?.id ?? null;
}

/** The ids from one to another, both included, in the order they are shown. */
export function rangeOf(ids: readonly string[], from: string, to: string): string[] {
  const a = ids.indexOf(from);
  const b = ids.indexOf(to);
  if (a === -1 || b === -1) return b === -1 ? [] : [to];
  return ids.slice(Math.min(a, b), Math.max(a, b) + 1);
}

export type UseSelectionOptions = {
  /** Every item's id, in the order they are shown. */
  ids: readonly string[];
  /** What is chosen, where the caller keeps it (with `onSelectedChange`). */
  selected?: readonly string[];
  /** What is chosen at first, where the hook keeps it. */
  defaultSelected?: readonly string[];
  /** Called with what is chosen, in the order shown, whenever it changes. */
  onSelectedChange?: (selected: string[]) => void;
  /** How the items stand, which decides what the arrow keys do. */
  layout?: SelectionLayout;
  /** Called by Enter and a double click on an item: open the folder, the file. */
  onOpen?: (id: string) => void;
};

/** What the box around the items takes: a grid that can hold several chosen at once. */
export type SelectionContainerProps = { role: "grid"; "aria-multiselectable": true };

/** What each item takes, spread on a `FileTile` or a `TableRow` (with `selected` beside it). */
export type SelectionItemProps = {
  ref: RefCallback<HTMLElement>;
  tabIndex: 0 | -1;
  "aria-selected": boolean;
  "data-selection-item": string;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onDoubleClick: (event: MouseEvent<HTMLElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
};

export type Selection = {
  /** What is chosen. Ids no longer in `ids` drop out. */
  selected: ReadonlySet<string>;
  /** The item that holds the keyboard's one stop in the box. */
  active: string | null;
  isSelected: (id: string) => boolean;
  /** Chooses these, and nothing else. */
  select: (ids: readonly string[]) => void;
  toggle: (id: string) => void;
  selectAll: () => void;
  clear: () => void;
  containerProps: SelectionContainerProps;
  itemProps: (id: string) => SelectionItemProps;
};

/** What a press inside an item does itself, so the item does not choose on it. */
const OWN_CONTROLS =
  "button, a[href], input, select, textarea, [role='menuitem'], [contenteditable]";

/**
 * Choosing several things in a list or a grid, the way a file manager does. A click chooses one
 * item; Cmd or Ctrl and a click adds or takes away one; Shift and a click takes everything from
 * the last one chosen. A press on an item's mark (`data-selection-toggle`) adds or takes away
 * that one, as Cmd does. A double click opens it (`onOpen`).
 *
 * The box is one stop for Tab and the arrow keys move through it, the chosen item following:
 * up and down in a list; in a grid also left and right, and up and down by the columns it
 * really has (found from where the items stand). Shift and an arrow takes the way along, Cmd
 * or Ctrl and an arrow moves without choosing, Space adds or takes away the item, Home and End
 * go to the first and last, Cmd or Ctrl and A chooses all, Enter opens, and Escape lets go of
 * what is chosen (and, with nothing chosen, is left to the page: a drawer to close).
 *
 * Spread `containerProps` on the box (`FileGrid`, `Table`) and `itemProps(id)` on each item,
 * with `selected={isSelected(id)}` beside it. Keys pressed in a field inside an item (a name
 * being changed) stay the field's. Pair it with an `ActionBar` for what can be done with the
 * chosen ones.
 */
export function useSelection({
  ids,
  selected: controlled,
  defaultSelected = [],
  onSelectedChange,
  layout = "list",
  onOpen,
}: UseSelectionOptions): Selection {
  const [own, setOwn] = useState<readonly string[]>(defaultSelected);
  const present = useMemo(() => new Set(ids), [ids]);
  const raw = controlled ?? own;
  const selected = useMemo(() => new Set(raw.filter((id) => present.has(id))), [raw, present]);
  // Where Shift takes a range from, and which item had the focus last (with its place, so the
  // stop goes to its neighbour when it is taken away).
  const [anchor, setAnchor] = useState<string | null>(null);
  const [focused, setFocused] = useState<{ id: string; index: number } | null>(null);
  const elements = useRef(new Map<string, HTMLElement>());

  const active = !focused
    ? (ids.find((id) => selected.has(id)) ?? ids[0] ?? null)
    : present.has(focused.id)
      ? focused.id
      : (ids[Math.min(focused.index, ids.length - 1)] ?? null);

  const change = (next: Iterable<string>) => {
    const chosen = new Set(next);
    const ordered = ids.filter((id) => chosen.has(id));
    if (controlled === undefined) setOwn(ordered);
    onSelectedChange?.(ordered);
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setAnchor(id);
    change(next);
  };
  const focusOn = (id: string) => {
    setFocused({ id, index: ids.indexOf(id) });
    elements.current.get(id)?.focus();
  };
  const boxes = (): ItemBox[] =>
    ids.flatMap((id) => {
      const element = elements.current.get(id);
      if (!element) return [];
      const { top, bottom, left, right } = element.getBoundingClientRect();
      return [{ id, top, bottom, left, right }];
    });

  /** Where an arrow, Home or End leads from an item; `null` for any other key. */
  const target = (id: string, key: string): string | null => {
    const index = ids.indexOf(id);
    switch (key) {
      case "ArrowDown":
        return layout === "grid" ? itemAcross(boxes(), id, "down") : (ids[index + 1] ?? null);
      case "ArrowUp":
        return layout === "grid" ? itemAcross(boxes(), id, "up") : (ids[index - 1] ?? null);
      case "ArrowRight":
        return layout === "grid" ? (ids[index + 1] ?? null) : null;
      case "ArrowLeft":
        return layout === "grid" ? (ids[index - 1] ?? null) : null;
      case "Home":
        return ids[0] ?? null;
      case "End":
        return ids.at(-1) ?? null;
      default:
        return null;
    }
  };

  const onKeyDown = (id: string) => (event: KeyboardEvent<HTMLElement>) => {
    // A key pressed in something inside the item (a field, a key) is that one's.
    if (event.target !== event.currentTarget) return;
    // Alt and a key is the browser's: Alt and the left arrow goes back a page.
    if (event.altKey) return;
    const command = event.metaKey || event.ctrlKey;
    if (event.key === " ") {
      event.preventDefault();
      toggle(id);
      return;
    }
    if (event.key === "Enter") {
      if (!onOpen) return;
      event.preventDefault();
      onOpen(id);
      return;
    }
    if (event.key === "Escape") {
      // With nothing chosen, Escape is the page's: a drawer or a dialog closes.
      if (selected.size === 0) return;
      event.preventDefault();
      event.stopPropagation();
      change([]);
      return;
    }
    if (command && event.key.toLowerCase() === "a") {
      event.preventDefault();
      change(ids);
      return;
    }
    const next = target(id, event.key);
    if (next === null) {
      // At the edge an arrow is still the box's, so the page does not scroll instead.
      if (event.key.startsWith("Arrow")) event.preventDefault();
      return;
    }
    event.preventDefault();
    focusOn(next);
    if (event.shiftKey) {
      // The range runs from where it began, which stays put while it grows or shrinks.
      const from = anchor !== null && present.has(anchor) ? anchor : id;
      setAnchor(from);
      change(rangeOf(ids, from, next));
    } else if (!command) {
      setAnchor(next);
      change([next]);
    }
  };

  const onClick = (id: string) => (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    const hit = event.target instanceof Element ? event.target : null;
    const control = hit?.closest(OWN_CONTROLS);
    if (control && control !== event.currentTarget && event.currentTarget.contains(control)) return;
    const mark = hit?.closest("[data-selection-toggle]");
    if (event.shiftKey) {
      // From the last one chosen, or from the item with the focus where nothing was chosen.
      const from = anchor !== null && present.has(anchor) ? anchor : (active ?? id);
      setAnchor(from);
      change(rangeOf(ids, from, id));
    } else if (event.metaKey || event.ctrlKey || mark) toggle(id);
    else {
      setAnchor(id);
      change([id]);
    }
    focusOn(id);
  };

  const itemProps = (id: string): SelectionItemProps => ({
    ref: (element) => {
      if (!element) return;
      elements.current.set(id, element);
      return () => {
        if (elements.current.get(id) === element) elements.current.delete(id);
      };
    },
    tabIndex: id === active ? 0 : -1,
    "aria-selected": selected.has(id),
    "data-selection-item": id,
    onClick: onClick(id),
    onDoubleClick: (event) => {
      if (event.target instanceof Element && event.target.closest(OWN_CONTROLS)) return;
      onOpen?.(id);
    },
    // Shift and a click would also mark the text between the two; the focus is set by the click.
    onMouseDown: (event) => {
      if (!event.shiftKey) return;
      // In a field inside the item (a name being changed) that is how its text is marked.
      const control = event.target instanceof Element && event.target.closest(OWN_CONTROLS);
      if (control && control !== event.currentTarget && event.currentTarget.contains(control))
        return;
      event.preventDefault();
    },
    onKeyDown: onKeyDown(id),
    onFocus: (event) => {
      if (event.target === event.currentTarget) setFocused({ id, index: ids.indexOf(id) });
    },
  });

  return {
    selected,
    active,
    isSelected: (id) => selected.has(id),
    select: (next) => change(next),
    toggle,
    selectAll: () => change(ids),
    clear: () => change([]),
    containerProps: { role: "grid", "aria-multiselectable": true },
    itemProps,
  };
}
