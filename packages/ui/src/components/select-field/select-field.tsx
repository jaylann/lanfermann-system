import type { ReactNode } from "react";

import { Field, FieldDescription, FieldLabel } from "@/components/field/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  type SelectOption,
  type SelectOptionGroup,
  type SelectProps,
  SelectTrigger,
  type SelectTriggerProps,
} from "@/components/select/select";

import { SelectFieldError } from "./select-field-error";

/** What a `SelectField` can list: what `Select` takes as `items`, with text values. */
export type SelectFieldItems =
  | Readonly<Record<string, ReactNode>>
  | ReadonlyArray<SelectOption>
  | ReadonlyArray<SelectOptionGroup>;

export type SelectFieldProps = {
  /** The key the choice is submitted under, and the one a `Form`'s `errors` are matched by. */
  name: string;
  /** What is chosen, as a noun in sentence case: „Status“. No colon, no asterisk. */
  label: ReactNode;
  /** The line under the field that stays: what follows from the choice. */
  description?: ReactNode;
  /**
   * The options, in the order they are listed: a `{ value: label }` record, or `Select`'s
   * `{ value, label, icon?, detail? }` objects, or groups of those.
   */
  items: SelectFieldItems;
  /** The value chosen when the form opens: what is stored, or the usual choice. */
  defaultValue?: string | null;
  /** The chosen value, when the form holds it; give `onValueChange` with it. */
  value?: string | null;
  /** Told each new choice, for a form whose other fields follow it. */
  onValueChange?: SelectProps<string>["onValueChange"];
  /** Whether the form refuses to be sent while nothing is chosen. */
  required?: boolean;
  /**
   * What a required field left empty is told on submit, as what to do: „Bitte wählen Sie einen
   * Status.“ Without it the browser's own sentence shows, in the browser's language.
   */
  requiredMessage?: ReactNode;
  disabled?: boolean;
  /** Shown while nothing is chosen, in italics like any placeholder. */
  placeholder?: ReactNode;
  /** The trigger's size. */
  size?: SelectTriggerProps["size"];
  /** Whether the list is open when the field first shows. */
  defaultOpen?: boolean;
  /** Whether the page behind the open list is locked (the default), as `Select`'s `modal`. */
  modal?: boolean;
  /** On the field: its width in the form. The trigger fills it. */
  className?: string;
};

function isRecord(items: SelectFieldItems): items is Readonly<Record<string, ReactNode>> {
  return !Array.isArray(items);
}

function isGroup(item: SelectOption | SelectOptionGroup): item is SelectOptionGroup {
  return "items" in item;
}

function option(item: SelectOption): ReactNode {
  return (
    <SelectItem key={item.value} value={item.value}>
      {item.label}
    </SelectItem>
  );
}

/** The rows of the list, from any of the three forms `items` takes. */
function rows(items: SelectFieldItems): ReactNode {
  if (isRecord(items)) {
    return Object.entries(items).map(([value, label]) => (
      <SelectItem key={value} value={value}>
        {label}
      </SelectItem>
    ));
  }
  return items.map((item: SelectOption | SelectOptionGroup, index) =>
    isGroup(item) ? (
      <SelectGroup key={index}>
        <SelectGroupLabel>{item.value}</SelectGroupLabel>
        {item.items.map(option)}
      </SelectGroup>
    ) : (
      option(item)
    ),
  );
}

/**
 * One value out of a list, as a field of a form: the label above, the select as wide as the
 * field, one line of help and the error under it. The choice is submitted under `name`, the
 * label and the help are announced with the trigger, and a click on the label puts the focus
 * there. Use it wherever a form asks for one of a few known values (a state, a kind, a plan);
 * for a select that stands alone in a toolbar, compose `Select` yourself.
 *
 * It has no hooks of its own, so a server page can place it: everything it takes is plain data
 * (leave `onValueChange` to a client form). What the server rejects arrives through the
 * `Form`'s `errors` under the same `name` and shows in the error line.
 */
export function SelectField({
  name,
  label,
  description,
  items,
  defaultValue,
  value,
  onValueChange,
  required,
  requiredMessage,
  disabled,
  placeholder = "Bitte wählen",
  size,
  defaultOpen,
  modal,
  className,
}: SelectFieldProps) {
  return (
    // The name and `disabled` belong to the field: the select reads both from it, and so do the
    // label (its disabled look) and the form (its errors). `required` is the control's own.
    <Field name={name} disabled={disabled} className={className}>
      {/* Not a native label: one would press the trigger with every click and pass it its
          hover. As a plain element a click puts the focus on the trigger and leaves it closed. */}
      <FieldLabel nativeLabel={false} render={<div />}>
        {label}
      </FieldLabel>
      <Select
        items={items}
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        required={required}
        defaultOpen={defaultOpen}
        modal={modal}
      >
        <SelectTrigger size={size} placeholder={placeholder} className="w-full" />
        <SelectContent>{rows(items)}</SelectContent>
      </Select>
      {description !== undefined && description !== null && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <SelectFieldError requiredMessage={requiredMessage} />
    </Field>
  );
}
