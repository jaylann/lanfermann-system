"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type { ReactNode } from "react";

import { FieldError } from "@/components/field/field";

/**
 * The one error line of a `SelectField`: what the form put on the field, or what the field says
 * for itself. With `requiredMessage`, a required field left empty says that instead of the
 * browser's own sentence, and only that: the general line stays away while the value is
 * missing, so two lines never show at once (a matched and an unmatched `FieldError` beside each
 * other would both answer).
 */
export function SelectFieldError({ requiredMessage }: { requiredMessage?: ReactNode }) {
  if (requiredMessage === undefined) return <FieldError />;
  return (
    <>
      <FieldError match="valueMissing">{requiredMessage}</FieldError>
      <FieldPrimitive.Validity>
        {(state) => (state.validity.valueMissing ? null : <FieldError />)}
      </FieldPrimitive.Validity>
    </>
  );
}
