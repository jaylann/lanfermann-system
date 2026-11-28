"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cva, type VariantProps } from "class-variance-authority";
import { createContext, type ReactNode, useContext, useMemo } from "react";

import { useButtonGroup } from "@/components/button-group/button-group-context";
import {
  buttonGroupKeyDisabledLook,
  buttonGroupKeyVariants,
} from "@/components/button-group/button-group-variants";
import { useGround, useGroundMode } from "@/components/ground/ground";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { ChevronDownGlyph } from "@/internal/glyphs";
import { ListMark, listTint } from "@/internal/list-mark";
import {
  listGroupLabel,
  listItem,
  listItemDetail,
  listSeparator,
  listSheet,
  popupMotion,
} from "@/internal/popup";
import { mergeClassName } from "@/lib/cn";

/** One entry of a select's `items`. */
export type SelectOption<Value = string> = {
  value: Value;
  label: ReactNode;
  /**
   * Stands before the label, in the list and in the trigger. Give every option one or none: a
   * list where only some rows have an icon reads as broken.
   */
  icon?: IconSvgElement;
  /**
   * A second, quieter piece of information, set at the right edge in the muted text colour: a
   * price, a unit, a code ("89 € / Monat", "EUR"). It shows in the list and in the trigger.
   */
  detail?: ReactNode;
};

/** A labelled group of options, as Base UI's `items` accepts it. */
export type SelectOptionGroup<Value = string> = {
  value: ReactNode;
  items: ReadonlyArray<SelectOption<Value>>;
};

type Options = ReadonlyArray<SelectOption<unknown>>;

// Lets the trigger and the items look up an option's icon without it being passed twice.
const OptionsContext = createContext<Options | undefined>(undefined);

/** Whether several options can be chosen: their rows then carry the tick, not the disc. */
const MultipleContext = createContext(false);

function isGroup(item: object): item is SelectOptionGroup<unknown> {
  return "items" in item && Array.isArray(item.items);
}

/** The options of `items` as one flat list; `undefined` for the `{ value: label }` record form. */
function flattenOptions(items: unknown): Options | undefined {
  if (!Array.isArray(items)) return undefined;
  return (items as ReadonlyArray<SelectOption<unknown> | SelectOptionGroup<unknown>>).flatMap(
    (item) => (isGroup(item) ? item.items : [item]),
  );
}

export type SelectProps<Value, Multiple extends boolean | undefined = false> = Omit<
  SelectPrimitive.Root.Props<Value, Multiple>,
  "items"
> & {
  /**
   * What can be chosen: `{ value, label, icon? }` objects (or groups of them), or a
   * `{ value: label }` record. The trigger shows the chosen option's label, and its icon.
   */
  items?:
    | Record<string, ReactNode>
    | ReadonlyArray<SelectOption<Value>>
    | ReadonlyArray<SelectOptionGroup<Value>>;
};

/**
 * One value out of a list that is too long for radios (more than five or so). Pass `items` to the
 * root so the trigger can show the label of the chosen value. For very long lists, or when
 * people know what they are looking for, a combobox is the better tool.
 */
export function Select<Value, Multiple extends boolean | undefined = false>({
  items,
  ...props
}: SelectProps<Value, Multiple>) {
  const options = useMemo(() => flattenOptions(items), [items]);
  return (
    <OptionsContext value={options}>
      <MultipleContext value={props.multiple === true}>
        <SelectPrimitive.Root items={items} {...props} />
      </MultipleContext>
    </OptionsContext>
  );
}

const iconSize = { sm: 14, md: 16, lg: 16 } as const;

/** A value without a matching option still shows, if it is text. */
function plainLabel(value: unknown): ReactNode {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

/** How the trigger shows the chosen value once options carry an icon or a detail. */
function renderValue(
  value: unknown,
  options: Options,
  placeholder: ReactNode,
  size: keyof typeof iconSize,
) {
  // Nothing chosen. Where several can be, that is an empty list, not `null`.
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-fg-muted italic">{placeholder}</span>;
  }
  const find = (candidate: unknown) => options.find((option) => Object.is(option.value, candidate));
  // Several values: their labels in a row, without icons.
  if (Array.isArray(value)) {
    return value.map((entry: unknown, index) => (
      <span key={index}>
        {index > 0 && ", "}
        {find(entry)?.label ?? plainLabel(entry)}
      </span>
    ));
  }
  const option = find(value);
  if (!option) return plainLabel(value);
  return (
    <span className="flex min-w-0 items-center gap-2">
      {option.icon && <Icon icon={option.icon} size={iconSize[size]} className="text-fg-muted" />}
      <span className="truncate">{option.label}</span>
      {option.detail !== undefined && (
        <span data-slot="select-value-detail" className={listItemDetail}>
          {option.detail}
        </span>
      )}
    </span>
  );
}

const selectTriggerVariants = cva(
  [
    // A fitting, not a socket: it is pressed, so it is raised like a button. The value inside is
    // set like typed text (regular weight, left-aligned).
    "touch-target relative inline-flex min-w-40 shrink-0 items-center justify-between gap-2 bg-raised depth-raised text-left text-fg select-none",
    "transition-[box-shadow,background-color,scale] spring-seat",
    "hover:depth-raised-hover hover:spring-snap active:bg-raised-pressed active:depth-pressed active:spring-snap",
    "data-popup-open:bg-raised-pressed data-popup-open:depth-pressed",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "data-invalid:depth-field-invalid",
    "data-disabled:pointer-events-none data-disabled:bg-disabled data-disabled:depth-flat data-disabled:text-on-disabled",
  ],
  {
    variants: {
      size: {
        sm: "h-(--control-sm) rounded-sm pr-(--field-pad-sm) pl-(--field-pad-sm) text-sm",
        md: "h-(--control-md) rounded-md pr-(--field-pad-md) pl-(--field-pad-md) text-control",
        lg: "h-(--control-lg) rounded-lg pr-(--field-pad-lg) pl-(--field-pad-lg) text-control",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SelectTriggerProps = Omit<SelectPrimitive.Trigger.Props, "children"> &
  VariantProps<typeof selectTriggerVariants> & {
    /** Shown while nothing is chosen: an example or an instruction, in italics like any placeholder. */
    placeholder?: ReactNode;
    /** Replaces how the chosen value is rendered. By default its label, and icon, from `items`. */
    children?: SelectPrimitive.Value.Props["children"];
  };

/**
 * Shows the chosen value and opens the list. Give it a name: an `aria-label`, or a `FieldLabel`
 * that is no native label (`<FieldLabel nativeLabel={false} render={<div />}>`, as Base UI asks
 * for a select: its trigger is a button, not an input).
 * Inside a `ButtonGroup` it is one key of the group's fitting and takes the group's size.
 */
export function SelectTrigger({
  className,
  size,
  placeholder,
  children,
  ...props
}: SelectTriggerProps) {
  const options = useContext(OptionsContext);
  const group = useButtonGroup();
  const resolvedSize = group?.size ?? size ?? "md";
  // For plain options Base UI renders the label itself. Once options carry an icon or a detail we
  // lay the value out ourselves: icon, label, and the detail at the right edge.
  const rich =
    options?.some((option) => option.icon !== undefined || option.detail !== undefined) === true
      ? (value: unknown) => renderValue(value, options, placeholder, resolvedSize)
      : undefined;
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-group-key={group ? "" : undefined}
      data-size={resolvedSize}
      disabled={group?.disabled || undefined}
      className={mergeClassName(
        group
          ? // A key of the group's fitting. The value is still set like typed text.
            [
              buttonGroupKeyVariants({ size: resolvedSize }),
              buttonGroupKeyDisabledLook,
              "min-w-32 justify-between text-left font-normal",
            ]
          : selectTriggerVariants({ size }),
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Value
        data-slot="select-value"
        placeholder={placeholder}
        className="min-w-0 flex-1 truncate data-placeholder:text-fg-muted data-placeholder:italic"
      >
        {children ?? rich}
      </SelectPrimitive.Value>
      <SelectPrimitive.Icon data-slot="select-icon" className="text-fg-muted">
        <ChevronDownGlyph />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export type SelectContentProps = SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "alignItemWithTrigger"
  >;

/**
 * The list, as a sheet that grows out of the trigger and is at least as wide. It opens below the
 * trigger like a menu (`alignItemWithTrigger` is off by default, unlike in Base UI).
 */
export function SelectContent({
  className,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  alignOffset,
  alignItemWithTrigger = false,
  ...props
}: SelectContentProps) {
  const ground = useGround();
  const groundMode = useGroundMode();
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        data-slot="select-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="z-50 outline-none"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-theme={ground}
          data-mode={groundMode}
          className={mergeClassName(
            [
              listSheet,
              popupMotion,
              "max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto",
              // Laid over the trigger there is nothing to grow out of: appear in place.
              "data-[side=none]:transition-none",
            ],
            className,
          )}
          {...props}
        />
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export type SelectItemProps = SelectPrimitive.Item.Props & {
  /** Stands before the label. Defaults to the icon of the matching option in the root's `items`. */
  icon?: IconSvgElement;
  /** Set at the right edge, muted. Defaults to the detail of the matching option in `items`. */
  detail?: ReactNode;
};

/**
 * One option. Its label starts at the row's left edge, where the group's label does. An icon,
 * if the option has one, stands before the label; a detail stands at the right edge. Both are
 * muted. The chosen one carries the disc at the right end (the tick where several can be chosen);
 * where the options have a detail, it stands on the tint instead (`listTint`).
 */
export function SelectItem({ className, children, icon, detail, ...props }: SelectItemProps) {
  const options = useContext(OptionsContext);
  const multiple = useContext(MultipleContext);
  const option = options?.find((candidate) => Object.is(candidate.value, props.value));
  const resolvedIcon = icon ?? option?.icon;
  const resolvedDetail = detail ?? option?.detail;
  const tinted = resolvedDetail !== undefined;
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={mergeClassName(["group", listItem, tinted && listTint], className)}
      {...props}
    >
      {resolvedIcon && (
        <Icon icon={resolvedIcon} className="text-fg-muted group-data-highlighted:text-fg" />
      )}
      <SelectPrimitive.ItemText data-slot="select-item-text" className="min-w-0 truncate">
        {children}
      </SelectPrimitive.ItemText>
      {resolvedDetail !== undefined && (
        <span data-slot="select-item-detail" className={listItemDetail}>
          {resolvedDetail}
        </span>
      )}
      {!tinted && <ListMark kind={multiple ? "multiple" : "single"} className="ml-auto" />}
    </SelectPrimitive.Item>
  );
}

export function SelectGroup(props: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

export function SelectGroupLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      className={mergeClassName(listGroupLabel, className)}
      {...props}
    />
  );
}

export function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={mergeClassName(listSeparator, className)}
      {...props}
    />
  );
}
