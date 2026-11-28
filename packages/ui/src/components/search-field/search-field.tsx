"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { type ReactNode, type Ref, useRef, useState } from "react";

import { Icon } from "@/components/icon/icon";
import { Input, type InputProps } from "@/components/input/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/input-group/input-group";
import { Shortcut, useShortcut } from "@/components/shortcut/shortcut";
import type { FieldSize } from "@/internal/field";
import { CloseGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

const symbolSize = { sm: 14, md: 16, lg: 18 } as const;

export type SearchFieldProps = Omit<
  InputProps,
  "size" | "value" | "defaultValue" | "onChange" | "type" | "className" | "ref"
> & {
  /** What is typed. The field is controlled: the page filters as it changes. */
  value: string;
  /** Called with every key, and with `""` when the field is cleared. */
  onValueChange: (value: string) => void;
  /** The size of the whole field, as an `InputGroup`'s. */
  size?: FieldSize;
  /**
   * The keys that bring the focus to the field from anywhere on the page, written as a
   * `Shortcut`'s (`mod+f`, `/`). They show at its end while it is empty. While the field has the
   * focus they do nothing, so a second ⌘F still opens the browser's own find.
   */
  shortcut?: string;
  /** What was found, in a few words ("4 Treffer"), shown while something is typed. */
  count?: ReactNode;
  /** The name of the key that clears the field. */
  clearLabel?: string;
  /** Classes for the group, the field as a whole: its width. */
  className?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * A field that filters what stands below it as it is typed into: a folder, a list, a table.
 * The search symbol stands in front; at its end the keys that reach it (`shortcut`) while it is
 * empty, and the key that clears it once something is typed. The two give way to each other
 * where they stand: the keys sink away as the cross seats in, and back.
 *
 * Escape clears what is typed, and pressed again leaves the field. Name it with `aria-label`
 * ("Dateien suchen"). Its placeholder may say where it searches ("In Rechnungen suchen"), as the
 * field has no label beside it; the `aria-label` says the same.
 */
export function SearchField({
  value,
  onValueChange,
  size = "md",
  shortcut,
  count,
  clearLabel,
  disabled = false,
  className,
  ref,
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}: SearchFieldProps) {
  const { messages } = useLocale();
  const field = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);
  const typed = value !== "";
  useShortcut(
    shortcut ?? "",
    () => {
      field.current?.focus();
      field.current?.select();
    },
    // A disabled field cannot take the focus: its keys stay the browser's (⌘F finds on the page).
    { enabled: shortcut !== undefined && !focused && !disabled },
  );
  const setRef = (element: HTMLInputElement | null) => {
    field.current = element;
    if (typeof ref === "function") ref(element);
    else if (ref) ref.current = element;
  };
  return (
    <InputGroup data-slot="search-field" size={size} className={className}>
      <InputGroupAddon>
        <Icon icon={Search01Icon} size={symbolSize[size]} />
      </InputGroupAddon>
      <Input
        ref={setRef}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Escape") return;
          // Escape here belongs to the field, not to a dialog or a selection around it.
          event.preventDefault();
          event.stopPropagation();
          if (typed) onValueChange("");
          else event.currentTarget.blur();
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        // The browser's own clearing cross and decorations: the field brings its own.
        className="[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        {...props}
        disabled={disabled}
      />
      {typed && count !== undefined ? (
        // Typing does not wait: the count is there in the first frame and changes in place.
        <InputGroupAddon data-slot="search-field-count" className="text-sm tabular-nums">
          {count}
        </InputGroupAddon>
      ) : null}
      {/* The keys and the cross share one place and cross-fade in it. */}
      <span data-slot="search-field-end" className="grid shrink-0 items-center justify-items-end">
        {shortcut === undefined ? null : (
          <span
            data-slot="search-field-shortcut"
            aria-hidden={typed ? true : undefined}
            className={cn(
              "col-start-1 row-start-1 flex pr-(--field-pad) transition-[opacity,scale] motion-reduce:scale-100",
              // The keys stay as a hint of what will reach the field, set back with the rest.
              disabled && "[&_kbd]:bg-transparent [&_kbd]:depth-flat [&_kbd]:text-on-disabled",
              typed ? "scale-92 opacity-0 spring-snap" : "scale-100 opacity-100 spring-seat",
            )}
          >
            <Shortcut keys={shortcut} />
          </span>
        )}
        <InputGroupButton
          aria-label={clearLabel ?? messages.searchField.clear}
          inert={!typed}
          onClick={() => {
            onValueChange("");
            field.current?.focus();
          }}
          className={cn(
            "col-start-1 row-start-1 mx-[3px] transition-[opacity,scale,color] motion-reduce:scale-100",
            typed
              ? "scale-100 opacity-100 spring-settle"
              : "pointer-events-none scale-80 opacity-0 spring-leave",
          )}
        >
          <CloseGlyph />
        </InputGroupButton>
      </span>
    </InputGroup>
  );
}
