"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import type { ReactNode } from "react";

import { useGround } from "@/components/ground/ground";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import {
  bareControl,
  fieldShell,
  fieldShellSize,
  type FieldSize,
  focusFieldControl,
} from "@/internal/field";
import { ChevronDownGlyph, CloseGlyph } from "@/internal/glyphs";
import {
  listGroupLabel,
  listItem,
  listItemDetail,
  listSeparator,
  listSheet,
  popupMotion,
} from "@/internal/popup";
import { cn, mergeClassName } from "@/lib/cn";

/** One entry of a combobox's `items`. The whole object is the value that gets chosen. */
export type ComboboxOption<Value = string> = {
  /** What is submitted with a form. */
  value: Value;
  /** What is shown, typed against, and put into the input once chosen. */
  label: string;
  /** Stands before the label in the list. Give every option one or none. */
  icon?: IconSvgElement;
  /** A second, quieter fact at the right edge of the row: a place, a number, a price. */
  detail?: ReactNode;
};

/** A labelled group of options, as Base UI's `items` accepts it. */
export type ComboboxOptionGroup<Value = string> = {
  value: string;
  items: ReadonlyArray<ComboboxOption<Value>>;
};

export type ComboboxProps<Option> = ComboboxPrimitive.Root.Props<Option, false>;

/**
 * A select you can type into: for lists too long to scan (a customer out of two hundred), where
 * people know what they are looking for. Typing filters the list; only an entry of the list can
 * be chosen. For five to fifteen options a `Select` is calmer.
 *
 * Pass the options as `items` (`{ value, label, icon?, detail? }`). The chosen option, the whole
 * object, is the value: `defaultValue={items[0]}`, `onValueChange={(option) => …}`. In a form
 * its `value` is what is submitted.
 *
 * Typing ignores case and accents: "gart" finds "Gärtnerei" and "cafe" finds "Café". Pass
 * `locale` (`"de-DE"`) so that does not depend on the machine. The first match is highlighted
 * while typing, so Enter takes it.
 */
export function Combobox<Option>({
  autoHighlight = true,
  filter,
  locale,
  ...props
}: ComboboxProps<Option>) {
  // Base UI's own matcher, set to compare letters by their base. Its default is the locale's
  // search collation, and the German one keeps "ä" apart from "a": whoever types a name without
  // its umlaut would find nothing.
  const folding = ComboboxPrimitive.useFilter({ locale, usage: "sort", sensitivity: "base" });
  return (
    <ComboboxPrimitive.Root
      autoHighlight={autoHighlight}
      locale={locale}
      filter={filter === undefined ? folding.contains : filter}
      {...props}
    />
  );
}

/** A small quiet button inside the field: the clear cross and the chevron. */
const innerButton = [
  "relative flex size-[calc(var(--field-height)-8px)] shrink-0 items-center justify-center rounded-[calc(var(--field-radius)-3px)] text-fg-muted select-none last:mr-1 touch-target",
  "hover:bg-hover hover:text-fg",
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent",
  "data-disabled:pointer-events-none data-disabled:text-on-disabled",
].join(" ");

export type ComboboxInputProps = Omit<ComboboxPrimitive.Input.Props, "className" | "size"> & {
  /** The size of the field, from the density. */
  size?: FieldSize;
  /** Classes for the field as a whole, e.g. its width. */
  className?: string;
  /** The accessible name of the button that clears the choice. */
  clearLabel?: string;
  /** The accessible name of the button that opens the list. */
  openLabel?: string;
};

/**
 * The field: an input to type into, a cross that clears the choice once there is one, and a
 * chevron that opens the whole list. Give it a name with a `FieldLabel` or an `aria-label`; a
 * placeholder is an example ("z. B. Schreinerei Huber"), not a label.
 */
export function ComboboxInput({
  className,
  size = "md",
  clearLabel = "Auswahl löschen",
  openLabel = "Liste öffnen",
  ...props
}: ComboboxInputProps) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      data-size={size}
      className={cn(fieldShell, fieldShellSize[size], className)}
      onMouseDown={focusFieldControl}
    >
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        data-field-control=""
        className={bareControl}
        {...props}
      />
      <ComboboxPrimitive.Clear
        data-slot="combobox-clear"
        aria-label={clearLabel}
        className={cn(
          innerButton,
          // It arrives with the first choice and leaves by fading, like every exit. A disabled
          // field has nothing to take back.
          "transition-[opacity,scale] spring-snap data-disabled:hidden data-starting-style:scale-75 data-starting-style:opacity-0",
          "data-ending-style:opacity-0 data-ending-style:spring-leave",
        )}
      >
        <CloseGlyph />
      </ComboboxPrimitive.Clear>
      <ComboboxPrimitive.Trigger
        data-slot="combobox-trigger"
        aria-label={openLabel}
        className={innerButton}
      >
        <ChevronDownGlyph />
      </ComboboxPrimitive.Trigger>
    </ComboboxPrimitive.InputGroup>
  );
}

export type ComboboxContentProps = Omit<ComboboxPrimitive.Popup.Props, "children"> &
  Pick<ComboboxPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset"> & {
    /**
     * Said when nothing matches what was typed. Name what was looked for ("Kein Kunde
     * gefunden."), not the mechanism.
     */
    empty?: ReactNode;
    /** The accessible name of the list, for when the field's label does not reach it. */
    listLabel?: string;
    /** The rows: a function of each item, or `ComboboxGroup`s for grouped items. */
    children?: ComboboxPrimitive.List.Props["children"];
  };

/**
 * The list, as a sheet that grows out of the field and is at least as wide. It looks and behaves
 * like the list of a `Select` or a `Menu`.
 */
export function ComboboxContent({
  className,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  alignOffset,
  empty = "Nichts gefunden.",
  listLabel = "Vorschläge",
  children,
  ...props
}: ComboboxContentProps) {
  const ground = useGround();
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        data-slot="combobox-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50 outline-none"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-theme={ground}
          className={mergeClassName(
            [listSheet, popupMotion, "max-w-(--available-width) min-w-(--anchor-width)"],
            className,
          )}
          {...props}
        >
          {/* Stays mounted, so a screen reader hears it; it only takes room when it speaks. */}
          <ComboboxPrimitive.Empty
            data-slot="combobox-empty"
            className="text-control text-fg-muted not-empty:px-2.5 not-empty:py-1.5"
          >
            {empty}
          </ComboboxPrimitive.Empty>
          <ComboboxPrimitive.List
            data-slot="combobox-list"
            aria-label={listLabel}
            className="max-h-[min(20rem,calc(var(--available-height)-0.5rem))] scroll-py-1 overflow-y-auto overscroll-contain outline-none"
          >
            {children}
          </ComboboxPrimitive.List>
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function isOption(value: unknown): value is ComboboxOption<unknown> {
  return typeof value === "object" && value !== null && "label" in value;
}

export type ComboboxItemProps = ComboboxPrimitive.Item.Props & {
  /** Stands before the label. Defaults to the option's `icon`. */
  icon?: IconSvgElement;
  /** Set at the right edge, muted. Defaults to the option's `detail`. */
  detail?: ReactNode;
};

/**
 * One row. Pass the option as `value`; its label, icon and detail are shown unless you give
 * children or props of your own. The chosen row carries the disc, as in a `Select`.
 */
export function ComboboxItem({
  className,
  children,
  icon,
  detail,
  value,
  ...props
}: ComboboxItemProps) {
  // Base UI types an item's value as `any`; it is whatever the caller's `items` hold.
  const itemValue: unknown = value;
  const option = isOption(itemValue) ? itemValue : undefined;
  const resolvedIcon = icon ?? option?.icon;
  const resolvedDetail = detail ?? option?.detail;
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      value={itemValue}
      className={mergeClassName(["group", listItem], className)}
      {...props}
    >
      <span aria-hidden className="mark mark-quiet group-data-selected:mark-on" />
      {resolvedIcon && <Icon icon={resolvedIcon} className="text-fg-muted" />}
      <span data-slot="combobox-item-text" className="min-w-0 truncate">
        {children ?? option?.label}
      </span>
      {resolvedDetail !== undefined && (
        <span data-slot="combobox-item-detail" className={listItemDetail}>
          {resolvedDetail}
        </span>
      )}
    </ComboboxPrimitive.Item>
  );
}

/** A group of rows. Pass the group's `items`, then a `ComboboxGroupLabel` and a `ComboboxCollection`. */
export const ComboboxGroup = ComboboxPrimitive.Group;

/** Renders the rows of the `ComboboxGroup` it stands in: a function of each item. */
export const ComboboxCollection = ComboboxPrimitive.Collection;

export function ComboboxGroupLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-group-label"
      className={mergeClassName(listGroupLabel, className)}
      {...props}
    />
  );
}

export function ComboboxSeparator({ className, ...props }: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={mergeClassName(listSeparator, className)}
      {...props}
    />
  );
}
