"use client";

import {
  type ComponentProps,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { splitName } from "@/components/attachment/kinds";
import { MiddleTruncate } from "@/components/middle-truncate/middle-truncate";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

/**
 * Where the base name of a file name ends: before its extension, which a rename keeps unless it
 * is typed over. A name without an extension is all base name.
 */
export function baseNameEnd(name: string): number {
  return name.length - splitName(name).end.length;
}

/**
 * A text of several lines as the one line a name is: every line break, with the spaces around
 * it, becomes one space. What is pasted into a name that wraps goes through it, so a break never
 * gets in; the spaces a name is typed with stay.
 */
export function flattenLines(text: string): string {
  return text.replace(/\s*[\r\n\u2028\u2029]+\s*/g, " ");
}

/**
 * The name a rename is asked for when `typed` is taken, or `undefined` where nothing changes:
 * the name as it was, and an empty one unless the value may be empty (`allowEmpty`), which is
 * then asked for as `""`.
 */
export function nameToTake(typed: string, value: string, allowEmpty: boolean): string | undefined {
  const next = flattenLines(typed).trim();
  if (next === value) return undefined;
  if (next === "" && !allowEmpty) return undefined;
  return next;
}

/** Puts the caret into `field`, with the base name of what it holds selected. */
function selectBaseName(field: HTMLElement): void {
  const range = document.createRange();
  const text = field.firstChild;
  if (text) {
    range.setStart(text, 0);
    range.setEnd(text, baseNameEnd(text.textContent ?? ""));
  } else {
    range.selectNodeContents(field);
  }
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * How a name that wraps breaks its lines, on the text at rest and on the text being changed
 * alike. An editable element brings rules of its own for this (it breaks inside a long word, and
 * WebKit wraps the space at a line's end), and one of them on the open text alone would move a
 * word as changing begins. Spaces are kept as typed, so the browser never swaps one for a
 * no-break space.
 */
const wrapped = "wrap-break-word whitespace-pre-wrap [line-break:auto]";

/** A refused name is underlined in danger, as a word that is spelt wrong is. */
const refusedLine =
  "aria-invalid:underline aria-invalid:decoration-danger aria-invalid:decoration-1 aria-invalid:underline-offset-[0.25em]";

export type EditableNameProps = Omit<ComponentProps<"span">, "children" | "onChange"> & {
  /** The name as it is: „hero.webp“. */
  value: string;
  /** Being changed: a field stands in the name's place. */
  editing: boolean;
  /** Called when changing it begins or ends: Enter, Escape, or the focus leaving. */
  onEditingChange: (editing: boolean) => void;
  /**
   * Called with a new name. Return why it is refused, as a sentence („Diesen Namen gibt es
   * hier schon.“), and the field stays open with the reason under it; return nothing to take
   * it. May return a promise; the field waits for it.
   */
  onRename: (name: string) => string | undefined | Promise<string | undefined>;
  /** The name of the field for assistive tech. */
  label?: string;
  /**
   * What stands in the name's place while there is none, muted, worded as what a press does:
   * „Titel hinzufügen“. At rest it is the key that begins the change; in the field it is the
   * placeholder.
   */
  placeholder?: string;
  /**
   * The value may be empty (an optional title): taking an empty field calls `onRename("")`.
   * Without it an empty field keeps the old name.
   */
  allowEmpty?: boolean;
  /**
   * The name wraps over as many lines as it takes and is changed as it stands: the text itself
   * becomes editable and keeps its lines, its size and its place. Still one line of text: Enter
   * takes it, and a pasted line break becomes a space. For a title; a file name stays one line.
   */
  multiline?: boolean;
};

/**
 * A name that is changed where it stands: in a tile, a row, an inspector. While it is changed it
 * is a field in the name's place with only the base name selected, so what is typed keeps the
 * extension („hero“ of „hero.webp“). The field is seamless: no edge and no halo of its own, only
 * the caret and the selection, so it reads as typing into the tile or the row. Whatever holds it
 * shows that it is being worked on (a chosen tile's ring). Enter takes the new name, Escape keeps
 * the old one, and the focus leaving takes it as Enter does. A name that is refused stays in the
 * field with the reason under it in words, and the name is underlined in danger; nothing shakes.
 * An unchanged or empty name changes nothing.
 *
 * A value that may be missing (a link's title) takes `allowEmpty` and a `placeholder`: clearing
 * the field stores nothing, and „Titel hinzufügen“ then stands in the name's place, muted, as the
 * key that begins the change. A title that wraps takes `multiline`: nothing moves as changing
 * begins, the lines only gain a caret.
 *
 * Changing begins where the page says (F2, a menu's „Umbenennen“, a folder just made): set
 * `editing`. Keys pressed in the field stay the field's, also inside a `useSelection` item, and
 * Escape in it closes only the field.
 */
export function EditableName({
  value,
  editing,
  onEditingChange,
  onRename,
  label,
  placeholder,
  allowEmpty = false,
  multiline = false,
  className,
  ...props
}: EditableNameProps) {
  const { messages } = useLocale();
  const field = useRef<HTMLInputElement>(null);
  const lines = useRef<HTMLSpanElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  // What had the focus before the change began (the tile, the key that began it).
  const before = useRef<Element | null>(null);
  const reasonId = useId();
  const [draft, setDraft] = useState(value);
  const [reason, setReason] = useState<ReactNode>(null);
  const [busy, setBusy] = useState(false);
  // The text a name that wraps opened with. It is rendered once: while it is typed the text is
  // the browser's, and a render that wrote it again would take the caret with it.
  const [opened, setOpened] = useState(value);
  // Read in the browser's own events: a rename under way is not asked for twice (Enter, then the
  // focus leaving), and a field closed from the keyboard hands the focus back to its key.
  const saving = useRef(false);
  const byKey = useRef(false);
  // Opening starts from the name as it is, without an old reason. State that follows a prop,
  // compared while rendering.
  const [wasEditing, setWasEditing] = useState(editing);
  if (wasEditing !== editing) {
    setWasEditing(editing);
    if (editing) {
      setDraft(value);
      setOpened(value);
      setReason(null);
    }
  }
  useLayoutEffect(() => {
    if (!editing) {
      // Closed with Enter or Escape: the focus goes back to the key that opened it, where the
      // value is still empty and that key stands again.
      if (byKey.current) opener.current?.focus();
      byKey.current = false;
      return;
    }
    const input = field.current;
    const text = lines.current;
    const target = input ?? text;
    if (!target) return;
    // What had the focus before (the tile, the key that began it) gets it back at the end.
    if (document.activeElement !== target) before.current = document.activeElement;
    if (input) {
      input.focus();
      input.setSelectionRange(0, baseNameEnd(input.value));
    } else if (text) {
      text.focus();
      selectBaseName(text);
    }
    return () => {
      // The field has gone with the focus still in it (Enter, Escape), which leaves the focus
      // on nothing. Where it left for something else (a click elsewhere), it stays there. A
      // value that is empty again hands it to its key instead (above).
      const previous = before.current;
      if (document.activeElement !== document.body) return;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [editing]);

  const commit = async () => {
    // One answer at a time: a second Enter while the first name is still being checked would
    // send it twice.
    if (saving.current) return;
    const next = nameToTake(draft, value, allowEmpty);
    if (next === undefined) {
      onEditingChange(false);
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      const refused = await onRename(next);
      if (refused !== undefined) {
        setReason(refused);
        (field.current ?? lines.current)?.focus();
        return;
      }
      onEditingChange(false);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  // Where there is no name its place is a key, in the name's type, that begins the change.
  const addKey =
    value === "" && placeholder !== undefined ? (
      <button
        ref={opener}
        type="button"
        data-slot="editable-name-placeholder"
        onClick={() => onEditingChange(true)}
        className={cn(
          "touch-target relative inline cursor-text rounded-xs text-start text-fg-muted hover:text-fg-body",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          multiline && wrapped,
        )}
      >
        {placeholder}
      </button>
    ) : null;
  const refusal = reason !== null && (
    <span id={reasonId} role="alert" className="text-sm font-semibold text-danger">
      {reason}
    </span>
  );

  if (multiline) {
    return (
      <span
        data-slot="editable-name"
        data-multiline=""
        data-editing={editing ? "" : undefined}
        className={cn("flex min-w-0 flex-col gap-1", className)}
        {...props}
      >
        {/* One box at rest and open, and the text an inline run in it both times: the same
            lines, to the pixel. */}
        <span data-slot="editable-name-lines" className={cn("block min-w-0", wrapped)}>
          {editing ? (
            <>
              <span
                // A node of its own, so the text typed into it goes with it when it closes.
                key="open"
                ref={lines}
                role="textbox"
                aria-label={label ?? messages.editableName.label}
                aria-placeholder={placeholder}
                aria-invalid={reason !== null ? true : undefined}
                aria-describedby={reason !== null ? reasonId : undefined}
                aria-busy={busy ? true : undefined}
                contentEditable="plaintext-only"
                suppressContentEditableWarning
                spellCheck={false}
                data-slot="editable-name-field"
                onInput={(event) => {
                  const text = event.currentTarget;
                  const typed = text.textContent ?? "";
                  const flat = flattenLines(typed);
                  // A break that got in some other way than a paste (a drop, a dictation), or a
                  // `<br>` the browser left in a cleared field: the text is written again as one
                  // line, with the caret at its end.
                  if (flat !== typed || text.childElementCount > 0) {
                    text.textContent = flat;
                    window.getSelection()?.selectAllChildren(text);
                    window.getSelection()?.collapseToEnd();
                  }
                  setDraft(flat);
                  if (reason !== null) setReason(null);
                }}
                onPaste={(event) => {
                  event.preventDefault();
                  const flat = flattenLines(event.clipboardData.getData("text/plain"));
                  // The browser's own insertion, the only one that stays in its undo history.
                  document.execCommand("insertText", false, flat);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    byKey.current = true;
                    void commit();
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    // Escape here closes the field, not the drawer or the selection around it.
                    event.stopPropagation();
                    byKey.current = true;
                    onEditingChange(false);
                  }
                }}
                onBlur={() => {
                  byKey.current = false;
                  if (reason === null) void commit();
                }}
                className={cn(wrapped, "caret-accent focus:outline-hidden", refusedLine)}
              >
                {opened}
              </span>
              {draft === "" && placeholder !== undefined && (
                // After the caret, where the key stood. A press on it types into the field.
                <span
                  aria-hidden
                  data-slot="editable-name-placeholder"
                  className="cursor-text text-fg-muted"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    lines.current?.focus();
                  }}
                >
                  {placeholder}
                </span>
              )}
            </>
          ) : (
            (addKey ?? (
              <span key="closed" data-slot="editable-name-text" className={wrapped}>
                {value}
              </span>
            ))
          )}
        </span>
        {editing && refusal}
      </span>
    );
  }

  if (!editing) {
    return (
      <span data-slot="editable-name" className={cn("min-w-0", className)} {...props}>
        {addKey ?? <MiddleTruncate text={value} />}
      </span>
    );
  }
  return (
    <span
      data-slot="editable-name"
      data-editing=""
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props}
    >
      <input
        ref={field}
        value={draft}
        aria-label={label ?? messages.editableName.label}
        aria-invalid={reason !== null ? true : undefined}
        aria-describedby={reason !== null ? reasonId : undefined}
        aria-busy={busy ? true : undefined}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        data-slot="editable-name-field"
        onChange={(event) => {
          setDraft(event.currentTarget.value);
          if (reason !== null) setReason(null);
        }}
        onKeyDown={(event) => {
          // A key pressed while a word is being composed (Japanese, Chinese) picks or drops the
          // word, not the name. Safari sends that Enter after the composition has ended, with
          // the key code 229, so both are asked (as in `promptKey`).
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
          if (event.key === "Enter") {
            event.preventDefault();
            byKey.current = true;
            void commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            // Escape here closes the field, not the drawer or the selection around it.
            event.stopPropagation();
            byKey.current = true;
            onEditingChange(false);
          }
        }}
        onBlur={() => {
          byKey.current = false;
          if (!busy && reason === null) void commit();
        }}
        className={cn(
          // Seamless: the name's own type in the name's own place, so nothing moves as changing
          // begins. The host (a chosen tile, a row, a title) carries the one ring; the caret and
          // the selected base name are the field's only signs. `outline-hidden` keeps a real
          // outline for forced colours.
          "m-0 w-full min-w-0 bg-transparent p-0 caret-accent focus:outline-hidden",
          "placeholder:text-fg-muted",
          // Refused: the reason under it says why, and the name is underlined in danger.
          refusedLine,
        )}
      />
      {refusal}
    </span>
  );
}
