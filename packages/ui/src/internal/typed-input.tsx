"use client";

import { type ComponentProps, useContext, useEffect, useRef, useState } from "react";

import { Input } from "@/components/input/input";
import { FieldActionsContext } from "@/internal/field-context";

export type TypedInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onValueChange" | "render" | "type"
> & {
  /** What stands in the field: the typed text, or the value written the way it is read. */
  text: string;
  onTextChange: (text: string) => void;
  /**
   * Typing has ended (the field was left, or Enter was pressed): read the text. Return why it
   * cannot be used, or nothing if it can.
   */
  onCommit: () => string | undefined;
  /** What a form receives under the field's name, whatever the field shows. */
  formValue: string;
  /** Why the current text cannot be used, as last found out; empty when it can. */
  problem: string;
};

/**
 * An input whose text is not its value: it shows "14.11.2026" and submits "2026-11-14". Dates,
 * times and ranges are typed into it.
 *
 * - The text is read when typing ends, never while it goes on: half a date is not a wrong date.
 * - Text that cannot be read stays where it is, to be corrected. The field is flagged at once and
 *   the reason becomes its validation message (`setCustomValidity`), so a `Field` shows it through
 *   its `FieldError`, as soon as the field is left, and a `Form` does not submit.
 * - The name goes to a hidden input that carries the value. A form posted the native way, or to
 *   a Server Action, gets the value under the field's name. `Form` hands the same value to
 *   `onFormSubmit` (it looks for `data-form-value`), where Base UI would report the text.
 *
 * It is the `Field`'s control like any `Input`: label, description and focus on an invalid
 * submit all work as usual. One thing differs: a `validate` on that `Field` is handed what the
 * control holds, which is the text as shown ("14.11.2026"), not the value.
 */
export function TypedInput({
  text,
  onTextChange,
  onCommit,
  formValue,
  problem,
  onBlur,
  onKeyDown,
  ...props
}: TypedInputProps) {
  const input = useRef<HTMLInputElement>(null);
  const field = useContext(FieldActionsContext);
  // What the input's own validity says right now, and what the `Field` was last shown.
  const told = useRef("");
  const shown = useRef("");

  // Whatever changed the problem (typing that ended, a pick in a calendar, a value from outside),
  // the input's own validity follows, and the `Field` around it looks again: its `FieldError`
  // shows the reason, or lets it go, without waiting for the form to be submitted.
  //
  // After every render, and compared with what was last written rather than with the last
  // `problem`: a commit writes the validity at once (below), and what follows in the same event
  // may take the problem back (a time picked from the list, a value the caller does not accept).
  // Then `problem` is what it was, and only the input still says otherwise. Nothing happens on
  // mount, also not when React mounts twice to check the effects.
  useEffect(() => {
    let look = shown.current !== problem;
    if (told.current !== problem) {
      told.current = problem;
      input.current?.setCustomValidity(problem);
      look = true;
    }
    if (look) {
      shown.current = problem;
      field?.current?.validate();
    }
  });

  // On commit it has to be in place before Base UI validates, which happens in the same event
  // when the field validates on blur: our handlers run first, an effect would come too late.
  const commit = () => {
    told.current = onCommit() ?? "";
    input.current?.setCustomValidity(told.current);
  };

  return (
    <Input
      autoComplete="off"
      value={text}
      onValueChange={onTextChange}
      onBlur={(event) => {
        commit();
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        // With a row of its list highlighted (a time field), Enter takes that row: the text
        // typed so far is not what is meant, and must not be read first.
        const takesRow = event.currentTarget.hasAttribute("aria-activedescendant");
        if (event.key === "Enter" && !takesRow) commit();
        onKeyDown?.(event);
      }}
      // Only when there is a problem: an `undefined` here would take away the flag the `Field`
      // sets for reasons of its own (a server error, `invalid`).
      {...(problem ? { "aria-invalid": true, "data-invalid": "" } : null)}
      {...props}
      // Base UI hands over the props of an `<input>`; its type only says "an element".
      render={({ name, ref, ...visible }: ComponentProps<"input">) => (
        <>
          <input
            {...visible}
            ref={(node) => {
              input.current = node;
              if (typeof ref === "function") return ref(node);
              if (ref) ref.current = node;
            }}
          />
          <input
            type="hidden"
            data-form-value=""
            name={name}
            value={formValue}
            disabled={visible.disabled}
            // A field that stands outside its form names it; the value has to go there too.
            form={visible.form}
          />
        </>
      )}
    />
  );
}

export type TypedValueOptions = {
  /** The value as it travels (an ISO string), or `""` for none (controlled). */
  value?: string;
  /** The value at first (uncontrolled). */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Reads typed text: the value, or why the text cannot be used. Never called with nothing. */
  read: (text: string) => string | { problem: string };
  /** Writes a value the way the field shows it. */
  show: (value: string) => string;
};

/**
 * The state behind a `TypedInput`: the value, the text that stands in the field, and what is
 * wrong with that text. Text that cannot be read reports an empty value and stays in the field.
 */
export function useTypedValue({
  value,
  defaultValue,
  onValueChange,
  read,
  show,
}: TypedValueOptions) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const [text, setText] = useState(() => show(current));
  const [problem, setProblem] = useState("");

  // A value that came from outside (a controlled field was given another): show it.
  const [shown, setShown] = useState(current);
  if (shown !== current) {
    setShown(current);
    setText(show(current));
    setProblem("");
  }

  // The value as last reported. One event can change it twice (typing ends, then a pick), and
  // the second change must be compared with the first, not with what this render started from.
  const latest = useRef(current);
  useEffect(() => {
    latest.current = current;
  });

  const change = (next: string) => {
    if (next === latest.current) return;
    latest.current = next;
    if (value === undefined) setInner(next);
    setShown(next);
    onValueChange?.(next);
  };

  return {
    value: current,
    text,
    setText,
    problem,
    /** A value that was chosen, not typed: from a calendar, an arrow key. */
    set: (next: string) => {
      setText(show(next));
      setProblem("");
      change(next);
    },
    /** Typing has ended. Returns why the text cannot be used, or nothing. */
    commit: (): string | undefined => {
      if (text.trim() === "") {
        setProblem("");
        change("");
        return undefined;
      }
      const result = read(text);
      if (typeof result !== "string") {
        setProblem(result.problem);
        change("");
        return result.problem;
      }
      setText(show(result));
      setProblem("");
      change(result);
      return undefined;
    },
  };
}
