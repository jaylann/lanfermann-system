import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { InputGroupAddon } from "@/components/input-group/input-group";

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "./number-field";

const meta = {
  title: "Components/NumberField",
  component: NumberField,
  parameters: {
    visual: { viewport: { width: 320, height: 150 }, target: '[data-slot="number-field-group"]' },
  },
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

const EURO = { style: "currency", currency: "EUR" } as const;

/**
 * An amount of money. The currency comes from `format`, so the field reads "2.780,00 €" at rest
 * and takes "2780", "2.780" or "2780,5" while typing.
 */
export const Amount: Story = {
  render: () => (
    <Field className="w-48">
      <FieldLabel>Betrag</FieldLabel>
      <NumberField defaultValue={2780} locale="de-DE" format={EURO}>
        <NumberFieldInput />
      </NumberField>
    </Field>
  ),
};

/**
 * A small count is stepped more often than typed: minus stands before the value, plus after it,
 * far enough apart that a thumb does not hit the wrong one. The value is centred between them.
 */
export const Quantity: Story = {
  parameters: { visual: { target: '[data-slot="number-field-increment"]' } },
  render: () => (
    <Field className="w-36">
      <FieldLabel>Anzahl</FieldLabel>
      <NumberField defaultValue={3} min={1} max={99} locale="de-DE">
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberField>
    </Field>
  ),
};

/** A share. The value is the fraction (0.19); `format` shows it as "19 %". */
export const Percentage: Story = {
  render: () => (
    <Field className="w-36">
      <FieldLabel>Umsatzsteuer</FieldLabel>
      <NumberField
        defaultValue={0.19}
        min={0}
        max={1}
        step={0.01}
        locale="de-DE"
        format={{ style: "percent", maximumFractionDigits: 1 }}
      >
        <NumberFieldInput />
      </NumberField>
    </Field>
  ),
};

/** A unit that is not a currency stands behind the value as an adornment. */
export const Unit: Story = {
  render: () => (
    <Field className="w-40">
      <FieldLabel>Aufwand</FieldLabel>
      <NumberField
        defaultValue={7.5}
        min={0}
        step={0.5}
        locale="de-DE"
        format={{ minimumFractionDigits: 1 }}
      >
        <NumberFieldInput />
        <InputGroupAddon>Std.</InputGroupAddon>
      </NumberField>
    </Field>
  ),
};

/** The field wears the error; the words say what is allowed. */
export const Invalid: Story = {
  parameters: { visual: { viewport: { width: 320, height: 180 } } },
  render: () => (
    <Field invalid className="w-64">
      <FieldLabel>Rabatt</FieldLabel>
      <NumberField
        defaultValue={1.2}
        locale="de-DE"
        format={{ style: "percent", maximumFractionDigits: 1 }}
      >
        <NumberFieldInput />
      </NumberField>
      <FieldError match>Bitte geben Sie höchstens 100 % ein.</FieldError>
    </Field>
  ),
};

export const Disabled: Story = {
  parameters: { visual: { viewport: { width: 320, height: 180 } } },
  render: () => (
    <Field disabled className="w-48">
      <FieldLabel>Stundensatz</FieldLabel>
      <NumberField defaultValue={95} locale="de-DE" format={EURO}>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberField>
      <FieldDescription>Ist im Tarif Werkstatt festgelegt.</FieldDescription>
    </Field>
  ),
};

export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 320, height: 230 } } },
  render: () => (
    <div className="flex w-44 flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <NumberField key={size} size={size} defaultValue={12} locale="de-DE">
          <NumberFieldDecrement />
          <NumberFieldInput aria-label="Anzahl" />
          <NumberFieldIncrement />
        </NumberField>
      ))}
    </div>
  ),
};

/**
 * The keyboard path, as a test: the arrows step (Shift for ten), a German decimal comma is
 * understood, the value is formatted again when the field is left, and the limits hold.
 */
export const Keyboard: Story = {
  render: () => (
    <Field className="w-48">
      <FieldLabel>Betrag</FieldLabel>
      <NumberField
        defaultValue={100}
        min={0}
        max={500}
        locale="de-DE"
        format={{ minimumFractionDigits: 2 }}
      >
        <NumberFieldInput />
      </NumberField>
    </Field>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Betrag");

    await step("Tab reaches the field, formatted the German way", async () => {
      await userEvent.tab();
      await expect(input).toHaveFocus();
      await expect(input).toHaveValue("100,00");
    });

    await step("A screen reader hears what it is in German", async () => {
      await expect(input).toHaveAttribute("aria-roledescription", "Zahlenfeld");
    });

    await step("ArrowUp steps by one, Shift+ArrowUp by ten, ArrowDown back", async () => {
      await userEvent.keyboard("{ArrowUp}");
      await expect(input).toHaveValue("101,00");
      await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
      await expect(input).toHaveValue("111,00");
      await userEvent.keyboard("{ArrowDown}");
      await expect(input).toHaveValue("110,00");
    });

    await step("A typed decimal comma is taken as one, and formatted on leaving", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "12,5");
      await userEvent.tab();
      await waitFor(() => expect(input).toHaveValue("12,50"));
    });

    await step("With a minimum of zero, a minus sign cannot even be typed", async () => {
      await userEvent.click(input);
      await userEvent.clear(input);
      await userEvent.type(input, "-4");
      await expect(input).toHaveValue("4");
    });

    await step("A value above the maximum is brought back to it on leaving", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "900");
      await userEvent.tab();
      await waitFor(() => expect(input).toHaveValue("500,00"));
    });
  },
};
