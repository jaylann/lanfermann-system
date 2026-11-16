"use client";

import { createContext, type RefObject } from "react";

/**
 * True inside a wrapper that wears the field look (`InputGroup`). An `Input` rendered there goes
 * bare, so there is one `Input` for both cases.
 */
export const FieldShellContext = createContext(false);

/**
 * The surrounding `Field`'s actions: `current.validate()` checks its control now, whatever its
 * `validationMode`. A control that finds out for itself that its text cannot be used (a date
 * field) calls it, so the reason is shown as soon as it is known and not only once the form is
 * submitted. A ref, so reading it never re-renders anything. `null` outside a `Field`.
 */
export const FieldActionsContext = createContext<RefObject<{ validate: () => void } | null> | null>(
  null,
);

/**
 * Whether the surrounding `Field` is disabled. Base UI tells its own controls; a part of ours
 * that stands beside the control (the button that opens a date field's calendar) asks here.
 */
export const FieldDisabledContext = createContext(false);
