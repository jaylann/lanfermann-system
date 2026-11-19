"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { type ReactNode, useRef, useState } from "react";

import {
  chipDisabledLook,
  chipFace,
  chipMotion,
  chipRemoveKey,
  chipShape,
  type ChipVariant,
} from "@/components/chip/chip-variants";
import { useGround } from "@/components/ground/ground";
import { Grow } from "@/components/grow/grow";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import {
  bareControl,
  fieldShell,
  fieldShellGrowing,
  fieldShellGrowingSize,
  fieldShellSize,
  type FieldSize,
  fieldText,
  focusFieldControl,
} from "@/internal/field";
import { ChevronDownGlyph, CloseGlyph, PlusGlyph } from "@/internal/glyphs";
import {
  listGroupLabel,
  listItem,
  listItemDetail,
  listSeparator,
  listSheet,
  popupMotion,
} from "@/internal/popup";
import { placeInRow, placeProps, useLive, usePresence } from "@/internal/presence";
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

/** The row that offers to make what was typed: an option that is not in the list yet. */
type CreateOption = ComboboxOption & { create: ReactNode };

function isOption(value: unknown): value is ComboboxOption<unknown> {
  return typeof value === "object" && value !== null && "label" in value;
}

function isCreateOption(value: unknown): value is CreateOption {
  return isOption(value) && "create" in value;
}

export type ComboboxProps<
  Value,
  Multiple extends boolean | undefined = false,
  Item = Value,
> = ComboboxPrimitive.Root.Props<Value, Multiple, Item> & {
  /**
   * Lets the reader make a value that is not in the list. While what they typed matches no
   * option's name exactly, a last row offers to create it; choosing that row calls this with
   * the typed text. Add the new option to your `items` and return it: it is chosen at once.
   * Needs a flat list of options and a controlled `value`.
   */
  onCreate?: (label: string) => Value | undefined;
  /** What the row that creates says: „Dringend“ anlegen. */
  createLabel?: (label: string) => ReactNode;
};

/**
 * A select you can type into: for lists too long to scan (a customer out of two hundred), where
 * people know what they are looking for. Typing filters the list; only an entry of the list can
 * be chosen. For five to fifteen options a `Select` is calmer.
 *
 * Pass the options as `items` (`{ value, label, icon?, detail? }`). The chosen option, the whole
 * object, is the value: `defaultValue={items[0]}`, `onValueChange={(option) => …}`. In a form
 * its `value` is what is submitted.
 *
 * With `multiple` the value is a list of options and the field is a `ComboboxChips`: every
 * chosen option is a chip in it. The list then stays open after a choice, so several can be
 * taken in a row, and each is submitted under the field's name.
 *
 * Typing ignores case and accents: "gart" finds "Gärtnerei" and "cafe" finds "Café". Pass
 * `locale` (`"de-DE"`) so that does not depend on the machine. The first match is highlighted
 * while typing, so Enter takes it.
 */
export function Combobox<Value, Multiple extends boolean | undefined = false, Item = Value>({
  autoHighlight = true,
  filter,
  locale,
  items,
  multiple,
  onCreate,
  createLabel = (label) => `„${label}“ anlegen`,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  onValueChange,
  onOpenChange,
  ...props
}: ComboboxProps<Value, Multiple, Item>) {
  // Base UI's own matcher, set to compare letters by their base. Its default is the locale's
  // search collation, and the German one keeps "ä" apart from "a": whoever types a name without
  // its umlaut would find nothing.
  const folding = ComboboxPrimitive.useFilter({ locale, usage: "sort", sensitivity: "base" });

  // What stands in the input, to know what a new option would be called.
  const [typed, setTyped] = useState(
    typeof defaultInputValue === "string" ? defaultInputValue : "",
  );
  // In a multi-select the text is kept here: it has served once a row was chosen with it, and
  // Base UI only clears it as the list closes, which this list does not do after a choice.
  const ownsText = multiple === true && inputValue === undefined;
  const wanted = onCreate ? typed.trim() : "";
  let offered = items;
  if (wanted !== "" && Array.isArray(items) && items.every(isOption)) {
    const sameName = new Intl.Collator(locale, { sensitivity: "base" });
    const exists = items.some((option) => sameName.compare(option.label, wanted) === 0);
    if (!exists) {
      const create: CreateOption = { value: wanted, label: wanted, create: createLabel(wanted) };
      offered = [...items, create] as typeof items;
    }
  }

  type Root = ComboboxPrimitive.Root.Props<Value, Multiple, Item>;
  const changed: Root["onValueChange"] = (next, details) => {
    if (ownsText && details.reason === "item-press") setTyped("");
    const chosen: unknown[] = Array.isArray(next) ? next : [next];
    const made = onCreate ? chosen.find(isCreateOption) : undefined;
    if (!made || !onCreate) {
      onValueChange?.(next, details);
      return;
    }
    // The row that creates never becomes the value: the caller's new option takes its place.
    const option = onCreate(made.label);
    const others = chosen.filter((entry) => !isCreateOption(entry));
    const value = multiple
      ? option === undefined
        ? others
        : [...others, option]
      : (option ?? null);
    onValueChange?.(value as Parameters<NonNullable<Root["onValueChange"]>>[0], details);
  };

  return (
    <ComboboxPrimitive.Root
      autoHighlight={autoHighlight}
      locale={locale}
      filter={filter === undefined ? folding.contains : filter}
      items={offered}
      multiple={multiple}
      inputValue={ownsText ? typed : inputValue}
      defaultInputValue={ownsText ? undefined : defaultInputValue}
      onInputValueChange={(value, details) => {
        setTyped(value);
        onInputValueChange?.(value, details);
      }}
      onValueChange={changed}
      onOpenChange={(open, details) => {
        // Several values are taken in a row: a choice does not close the list.
        if (multiple && !open && details.reason === "item-press") details.cancel();
        onOpenChange?.(open, details);
      }}
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

const chipKey = (item: unknown) => String(isOption(item) ? item.value : item);
const chipText = (item: unknown) => (isOption(item) ? item.label : String(item));

type ChipsRowProps = Omit<ComboboxPrimitive.Input.Props, "className" | "size"> & {
  chosen: readonly unknown[];
  chipVariant: ChipVariant;
  chipsLabel: string;
  removeLabel: string;
  chipsHint: (count: number) => string;
};

/**
 * The chips and the input, in one row that wraps. A chip that its owner took out of the value
 * stays where it stood until it has faded, as in a `ChipGroup`, but as a plain copy: Base UI
 * counts its chips to know which one Backspace takes, and one that is gone must not be counted.
 */
function ChipsRow({
  chosen,
  chipVariant,
  chipsLabel,
  removeLabel,
  chipsHint,
  placeholder,
  ...props
}: ChipsRowProps) {
  // Page load does not animate: only a chip that joins after the field stands seats in.
  const live = useLive();
  const row = useRef<HTMLDivElement>(null);
  const { places, left } = usePresence(chosen, chipKey, row);
  const look = cn(chipShape, chipFace[chipVariant], "pr-0.5");
  return (
    <ComboboxPrimitive.Chips
      ref={row}
      data-slot="combobox-chips"
      data-live={live ? "" : undefined}
      aria-label={chosen.length > 0 ? chipsLabel : undefined}
      // 22px chips in a field of the control's height: the padding that is left over above and
      // below also stands before the first chip, so it sits in the corner concentrically.
      className="flex min-h-(--field-height) min-w-0 flex-1 flex-wrap items-center gap-(--chip-gap) p-[calc((var(--field-height)-1.375rem)/2)] [--chip-gap:0.25rem]"
    >
      {places.map((place) => {
        const text = chipText(place.item);
        return (
          <span
            key={place.key}
            data-slot="chip-place"
            {...placeProps(place, left)}
            className={placeInRow}
          >
            <span className="flex min-w-0 *:shrink-0">
              {place.leaving ? (
                // A new node, so its fade starts from a first frame of its own.
                <span
                  aria-hidden
                  data-slot="combobox-chip"
                  className={cn(
                    look,
                    "opacity-0 transition-opacity spring-leave starting:opacity-100",
                  )}
                >
                  {text}
                  <span className="flex size-[1.125rem] items-center justify-center text-fg-muted">
                    <CloseGlyph width={8} height={8} />
                  </span>
                </span>
              ) : (
                <ComboboxPrimitive.Chip
                  data-slot="combobox-chip"
                  aria-label={text}
                  className={cn(
                    look,
                    chipDisabledLook,
                    // Disabled, the key is gone and the chip's text keeps its own padding.
                    "data-disabled:pr-2",
                    chipMotion,
                    // Arrow left walks into the chips: the one that has the keyboard shows it.
                    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                  )}
                >
                  <span data-slot="chip-label" className="truncate">
                    {text}
                  </span>
                  <ComboboxPrimitive.ChipRemove
                    data-slot="chip-remove"
                    aria-label={`${text} ${removeLabel}`}
                    className={cn(chipRemoveKey, "data-disabled:hidden")}
                  >
                    <CloseGlyph width={8} height={8} />
                  </ComboboxPrimitive.ChipRemove>
                </ComboboxPrimitive.Chip>
              )}
            </span>
          </span>
        );
      })}
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        data-field-control=""
        // A placeholder is an example for an empty field; beside chips it would read as one more.
        placeholder={chosen.length > 0 ? undefined : placeholder}
        aria-description={chosen.length > 0 ? chipsHint(chosen.length) : undefined}
        className={cn(
          "h-[1.375rem] bg-transparent px-1.5 text-control text-fg focus:outline-hidden data-disabled:text-on-disabled",
          // It stands beside the last chip and takes the rest of the line. Where the browser
          // can size a field by its text, it only takes a line of its own once what is typed
          // no longer fits beside the chips: empty, it asks for no more than the caret's room.
          // Elsewhere it keeps a place of its own and scrolls.
          "w-12 max-w-full min-w-12 grow supports-[field-sizing:content]:[field-sizing:content] supports-[field-sizing:content]:w-auto supports-[field-sizing:content]:min-w-6",
          // Alone in the field its text starts where every field's text does.
          "first:pl-[calc(var(--field-pad)-(var(--field-height)-1.375rem)/2)]",
          fieldText,
        )}
        {...props}
      />
    </ComboboxPrimitive.Chips>
  );
}

export type ComboboxChipsProps = Omit<ComboboxPrimitive.Input.Props, "className" | "size"> & {
  /** The size of the field, from the density. */
  size?: FieldSize;
  /** Classes for the field as a whole, e.g. its width. */
  className?: string;
  /**
   * `flat` (the default): the chips are drawn like a `Badge`, quiet in the field. `plug`: raised
   * plugs seated in it, like a `Chip` on its own, where the values are the field's point (the
   * recipients of a message).
   */
  chipVariant?: ChipVariant;
  /** The name of the row of chips, for assistive tech. */
  chipsLabel?: string;
  /** The verb of the key that takes a chip away. The chip's text is said before it. */
  removeLabel?: string;
  /** Said with the input once something is chosen: how many, and how to reach them. */
  chipsHint?: (count: number) => string;
  /** The accessible name of the button that clears every choice. */
  clearLabel?: string;
  /** The accessible name of the button that opens the list. */
  openLabel?: string;
};

/**
 * The field of a `Combobox multiple`: every chosen option is a chip in it, and the input stands
 * after the last one. Backspace in the empty input takes the last chip, Arrow left walks into
 * the chips, and each chip has a key that takes it away.
 *
 * A chip that joins seats into its place, one that leaves fades while its neighbours close up,
 * and when the chips need another line the field eases to its new height, so what stands below
 * is pushed and does not jump. Give it a name with a `FieldLabel` or an `aria-label`; the
 * placeholder is an example and shows only while nothing is chosen.
 */
export function ComboboxChips({
  className,
  size = "md",
  chipVariant = "flat",
  chipsLabel = "Ausgewählt",
  removeLabel = "entfernen",
  chipsHint = (count) =>
    `${count} ausgewählt. Am Anfang des Felds führt die Pfeiltaste nach links zu den gewählten Einträgen.`,
  clearLabel = "Auswahl löschen",
  openLabel = "Liste öffnen",
  ...props
}: ComboboxChipsProps) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      data-size={size}
      // The socket itself is the block that eases to a new height (`Grow`): it clips its chips
      // while it moves, and its halo, a shadow, stays whole.
      render={
        <Grow
          contentClassName="flex items-start"
          className={cn(
            fieldShellGrowing,
            fieldShellGrowingSize[size],
            // The halo holds while the keyboard is on a chip.
            "has-[[data-slot=combobox-chip]:focus-visible]:depth-field-focus",
            className,
          )}
        />
      }
      onMouseDown={focusFieldControl}
    >
      <ComboboxPrimitive.Value>
        {(chosen: readonly unknown[] | null) => (
          <ChipsRow
            chosen={chosen ?? []}
            chipVariant={chipVariant}
            chipsLabel={chipsLabel}
            removeLabel={removeLabel}
            chipsHint={chipsHint}
            {...props}
          />
        )}
      </ComboboxPrimitive.Value>
      <ComboboxPrimitive.Clear
        data-slot="combobox-clear"
        aria-label={clearLabel}
        className={cn(
          innerButton,
          "mt-1 transition-[opacity,scale] spring-snap data-disabled:hidden data-starting-style:scale-75 data-starting-style:opacity-0",
          "data-ending-style:opacity-0 data-ending-style:spring-leave",
        )}
      >
        <CloseGlyph />
      </ComboboxPrimitive.Clear>
      <ComboboxPrimitive.Trigger
        data-slot="combobox-trigger"
        aria-label={openLabel}
        className={cn(innerButton, "mt-1")}
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
      {isCreateOption(itemValue) ? (
        // The row that makes a new option: a plus where the others carry their mark.
        <span
          aria-hidden
          className="flex size-2 shrink-0 items-center justify-center text-fg-muted"
        >
          <PlusGlyph width={10} height={10} />
        </span>
      ) : (
        <span aria-hidden className="mark mark-quiet group-data-selected:mark-on" />
      )}
      {resolvedIcon && <Icon icon={resolvedIcon} className="text-fg-muted" />}
      <span data-slot="combobox-item-text" className="min-w-0 truncate">
        {children ?? (isCreateOption(itemValue) ? itemValue.create : option?.label)}
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
