"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DateField,
  DateRangeField,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Form,
  Input,
  NumberField,
  NumberFieldInput,
  TimeField,
} from "@lanfermann/ui";
import { useActionState, useState } from "react";

import { type QuoteState, saveQuote } from "./actions";

const initial: QuoteState = { errors: {} };

/**
 * The form contract in a real Next build: `Form` posts to a Server Action, the action's errors
 * come back keyed by field name and show under their fields, and the date, range and time
 * fields submit their ISO values under their names.
 *
 * React resets a form once its action has run. A plain `Input` would be empty again after a
 * rejected submit, so the one here is controlled. The fields that keep their own value (number,
 * date, range, time) are not touched by a reset.
 */
export function QuoteForm() {
  const [state, formAction, pending] = useActionState(saveQuote, initial);
  const [customer, setCustomer] = useState("");
  return (
    <Form action={formAction} errors={state.errors} className="max-w-md">
      <Field name="kunde">
        <FieldLabel>Kunde</FieldLabel>
        <Input
          required
          placeholder="z. B. Schreinerei Huber"
          value={customer}
          onValueChange={setCustomer}
        />
        <FieldError />
      </Field>
      <Field name="betrag">
        <FieldLabel>Betrag</FieldLabel>
        <NumberField
          defaultValue={2780}
          min={0}
          locale="de-DE"
          format={{ style: "currency", currency: "EUR" }}
        >
          <NumberFieldInput />
        </NumberField>
      </Field>
      <Field name="gueltig">
        <FieldLabel>Gültig bis</FieldLabel>
        <DateField required defaultValue="2026-11-30" />
        <FieldError />
      </Field>
      <Field name="zeitraum">
        <FieldLabel>Leistungszeitraum</FieldLabel>
        <DateRangeField required defaultValue={{ from: "2026-12-07", to: "2026-12-18" }} />
        <FieldDescription>Frühestens am Tag, bis zu dem das Angebot gilt.</FieldDescription>
        <FieldError />
      </Field>
      <Field name="beginn">
        <FieldLabel>Beginn am ersten Tag</FieldLabel>
        <TimeField defaultValue="07:30" className="w-36" />
        <FieldError />
      </Field>
      <Button type="submit" variant="primary" loading={pending} className="self-start">
        Angebot speichern
      </Button>
      {state.saved && (
        <Alert tone="success">
          <AlertTitle>Angebot gespeichert.</AlertTitle>
          <AlertDescription>
            <code className="font-mono text-sm">{JSON.stringify(state.saved)}</code>
          </AlertDescription>
        </Alert>
      )}
    </Form>
  );
}
