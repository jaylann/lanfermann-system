import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "@/components/input/input";

import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

const meta = {
  title: "Components/Field",
  component: Field,
  parameters: { visual: { viewport: { width: 400, height: 170 } } },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A label says what goes in; one line of help may stay visible below. */
export const Default: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel>Betrieb</FieldLabel>
      <Input placeholder="z. B. Schreinerei Huber" />
      <FieldDescription>So erscheint Ihr Name auf Angeboten.</FieldDescription>
    </Field>
  ),
};

/** The error starts with what to do. It carries an icon: colour alone never says "wrong". */
export const Invalid: Story = {
  render: () => (
    <Field invalid className="w-80">
      <FieldLabel>E-Mail-Adresse</FieldLabel>
      <Input type="email" defaultValue="max@schreinerei" />
      <FieldError match>Bitte geben Sie eine vollständige E-Mail-Adresse ein.</FieldError>
    </Field>
  ),
};

/**
 * Type an incomplete address and tab out: the error opens below the field and pushes the help
 * text down. (A required field left empty only complains once the form is submitted, so nobody is
 * scolded for tabbing through.)
 */
export const Validation: Story = {
  parameters: { visual: { viewport: { width: 400, height: 200 } } },
  render: () => (
    <Field className="w-80" validationMode="onBlur">
      <FieldLabel>E-Mail-Adresse</FieldLabel>
      <Input type="email" required placeholder="z. B. max@schreinerei-huber.de" />
      <FieldError match="typeMismatch">
        Bitte geben Sie eine vollständige E-Mail-Adresse ein.
      </FieldError>
      <FieldError match="valueMissing">Bitte geben Sie Ihre E-Mail-Adresse ein.</FieldError>
      <FieldDescription>Dorthin senden wir Ihr Angebot.</FieldDescription>
    </Field>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Field disabled className="w-80">
      <FieldLabel>Kundennummer</FieldLabel>
      <Input defaultValue="LF-2026-0418" />
      <FieldDescription>Wird von uns vergeben.</FieldDescription>
    </Field>
  ),
};
