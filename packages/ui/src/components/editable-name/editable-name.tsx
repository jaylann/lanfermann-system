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
  className,
  ...props
}: EditableNameProps) {
  const { messages } = useLocale();
  const field = useRef<HTMLInputElement>(null);
  const reasonId = useId();
  const [draft, setDraft] = useState(value);
  const [reason, setReason] = useState<ReactNode>(null);
  const [busy, setBusy] = useState(false);
  // Opening starts from the name as it is, without an old reason. State that follows a prop,
  // compared while rendering.
  const [wasEditing, setWasEditing] = useState(editing);
  if (wasEditing !== editing) {
    setWasEditing(editing);
    if (editing) {
      setDraft(value);
      setReason(null);
    }
  }
  useLayoutEffect(() => {
    if (!editing) return;
    const input = field.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(0, baseNameEnd(input.value));
  }, [editing]);

  const commit = async () => {
    const next = draft.trim();
    if (next === value || next === "") {
      onEditingChange(false);
      return;
    }
    setBusy(true);
    try {
      const refused = await onRename(next);
      if (refused !== undefined) {
        setReason(refused);
        field.current?.focus();
        return;
      }
      onEditingChange(false);
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <span data-slot="editable-name" className={cn("min-w-0", className)} {...props}>
        <MiddleTruncate text={value} />
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
        spellCheck={false}
        autoComplete="off"
        data-slot="editable-name-field"
        onChange={(event) => {
          setDraft(event.currentTarget.value);
          if (reason !== null) setReason(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            // Escape here closes the field, not the drawer or the selection around it.
            event.stopPropagation();
            onEditingChange(false);
          }
        }}
        onBlur={() => {
          if (!busy && reason === null) void commit();
        }}
        className={cn(
          // Seamless: the name's own type in the name's own place, so nothing moves as changing
          // begins. The host (a chosen tile, a row, a title) carries the one ring; the caret and
          // the selected base name are the field's only signs. `outline-hidden` keeps a real
          // outline for forced colours.
          "m-0 w-full min-w-0 bg-transparent p-0 caret-accent focus:outline-hidden",
          // Refused: the reason under it says why, and the name is underlined in danger, as a
          // word that is spelt wrong is.
          "aria-invalid:underline aria-invalid:decoration-danger aria-invalid:decoration-1 aria-invalid:underline-offset-[0.25em]",
        )}
      />
      {reason !== null && (
        <span id={reasonId} role="alert" className="text-sm font-semibold text-danger">
          {reason}
        </span>
      )}
    </span>
  );
}
