"use client";

import { Form as FormPrimitive } from "@base-ui/react/form";

import { mergeClassName } from "@/lib/cn";

/** `FormValues` types what `onFormSubmit` receives: one key per `Field` `name`. */
// The primitive's own constraint; `any` lets a value be whatever its control reports.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormProps<FormValues extends Record<string, any> = Record<string, any>> =
  FormPrimitive.Props<FormValues>;

/**
 * A `<form>` that knows its fields. Give each `Field` a `name`; then:
 *
 * - `onFormSubmit` receives the values as an object (`{ email, plan }`) once every field is
 *   valid. The page does not reload.
 * - `errors` takes what the server rejected, keyed by field name (`{ email: "…" }`). Each
 *   `FieldError` shows its message, and it is gone as soon as that field is changed.
 * - With a Server Action, pass `action` and the action's errors:
 *   `<Form action={formAction} errors={state.errors}>` (`useActionState`).
 *
 * A required field left empty only complains once the form is submitted; nobody is scolded for
 * tabbing through. Then the first invalid field takes the focus. To check a field as soon as it
 * is left, give that `Field` `validationMode="onBlur"`.
 *
 * A field the server may reject gets one `<FieldError />` without `match`: it shows the server's
 * message, or the field's own (from `validate`). Do not put matched errors beside it on the same
 * field, or two lines show at once.
 *
 * A date, time or range field hands over its ISO value (`2026-11-14`), not the text it shows.
 *
 * React resets a form once its `action` has run: an `Input` or `Textarea` goes back to its
 * `defaultValue`, while the fields that hold a value of their own (number, combobox, select,
 * date, time, checkbox, switch) keep it. So control the plain inputs (`value`) whose text must
 * survive a rejected submit; to empty the whole form after a success, give it a new `key`.
 *
 * Fields stand 16px apart. Word an error as what to do ("Bitte geben Sie …").
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Form<FormValues extends Record<string, any> = Record<string, any>>({
  className,
  onFormSubmit,
  ...props
}: FormProps<FormValues>) {
  return (
    <FormPrimitive<FormValues>
      data-slot="form"
      className={mergeClassName("flex flex-col gap-4", className)}
      onFormSubmit={
        onFormSubmit &&
        ((values, details) => onFormSubmit(submittedValues(values, details.event.target), details))
      }
      {...props}
    />
  );
}

/**
 * Some fields show one thing and submit another: a date reads "14.11.2026" and is "2026-11-14".
 * Such a field keeps its value in a hidden input marked `data-form-value` (see `TypedInput`).
 * Base UI collects what the visible control holds, so the values are set right here: what
 * `onFormSubmit` receives is what a posted form would carry.
 */
function submittedValues<FormValues extends Record<string, unknown>>(
  values: FormValues,
  form: EventTarget | null,
): FormValues {
  if (!(form instanceof HTMLFormElement)) return values;
  const carried = form.querySelectorAll<HTMLInputElement>('input[type="hidden"][data-form-value]');
  if (carried.length === 0) return values;
  const next: Record<string, unknown> = { ...values };
  for (const input of carried) {
    if (input.name && !input.disabled) next[input.name] = input.value;
  }
  // The same keys with the same kind of value (a string), so it is still the caller's type.
  return next as FormValues;
}
