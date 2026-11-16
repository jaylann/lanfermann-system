import { Search01Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { Icon } from "@/components/icon/icon";
import { Input } from "@/components/input/input";

import { InputGroup, InputGroupAddon, InputGroupButton } from "./input-group";

const meta = {
  title: "Components/InputGroup",
  component: InputGroup,
  parameters: {
    visual: { viewport: { width: 360, height: 130 }, target: '[data-slot="input-group"]' },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An icon says what the field is for before a word is typed. It is not the label. */
export const Search: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupAddon>
        <Icon icon={Search01Icon} />
      </InputGroupAddon>
      <Input aria-label="Kunden suchen" inputMode="search" placeholder="z. B. Schreinerei Huber" />
    </InputGroup>
  ),
};

/** A unit stands behind the value, muted. Amounts are set right, in tabular digits. */
export const Amount: Story = {
  render: () => (
    <Field className="w-44">
      <FieldLabel>Betrag</FieldLabel>
      <InputGroup>
        <Input inputMode="decimal" defaultValue="2.780,00" className="text-right tabular-nums" />
        <InputGroupAddon>€</InputGroupAddon>
      </InputGroup>
    </Field>
  ),
};

/**
 * A fixed prefix is part of the field, not of the value. Where it runs on into the value, as an
 * address does, `-mr-1.5` on the addon closes the gap. An address is set in the mono face.
 */
export const Prefix: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel>Website</FieldLabel>
      <InputGroup>
        <InputGroupAddon className="-mr-1.5 font-mono text-sm">https://</InputGroupAddon>
        <Input
          type="text"
          inputMode="url"
          defaultValue="schreinerei-mustermann.de"
          className="font-mono text-sm"
        />
      </InputGroup>
    </Field>
  ),
};

function PasswordField() {
  const [shown, setShown] = useState(false);
  return (
    <Field className="w-72">
      <FieldLabel>Passwort</FieldLabel>
      <InputGroup>
        <Input
          type={shown ? "text" : "password"}
          autoComplete="current-password"
          defaultValue="werkstatt-2026"
        />
        <InputGroupButton
          aria-label="Passwort anzeigen"
          aria-pressed={shown}
          onClick={() => setShown((value) => !value)}
        >
          {/* Both eyes are stacked and cross-fade, so the button does not blink. */}
          <span className="relative flex size-4">
            <Icon
              icon={ViewIcon}
              className={`absolute inset-0 transition-opacity spring-snap ${shown ? "opacity-0" : ""}`}
            />
            <Icon
              icon={ViewOffIcon}
              className={`absolute inset-0 transition-opacity spring-snap ${shown ? "" : "opacity-0"}`}
            />
          </span>
        </InputGroupButton>
      </InputGroup>
    </Field>
  );
}

/**
 * A quiet button inside the field. It is a toggle: its name stays ("Passwort anzeigen") and
 * `aria-pressed` says whether it is on.
 */
export const Password: Story = {
  parameters: {
    visual: {
      viewport: { width: 360, height: 150 },
      motion: [{ name: "reveal", click: '[data-slot="input-group-button"]', frames: 5 }],
    },
  },
  render: () => <PasswordField />,
};

/** The group wears the error, like a plain input: danger edge and halo, the reason in words. */
export const Invalid: Story = {
  parameters: { visual: { viewport: { width: 360, height: 170 } } },
  render: () => (
    <Field invalid className="w-72">
      <FieldLabel>Betrag</FieldLabel>
      <InputGroup>
        <Input inputMode="decimal" defaultValue="0,00" className="text-right tabular-nums" />
        <InputGroupAddon>€</InputGroupAddon>
      </InputGroup>
      <FieldError match>Bitte geben Sie einen Betrag über 0 € ein.</FieldError>
    </Field>
  ),
};

/** Disabled, the whole field goes flat, adornments included. */
export const Disabled: Story = {
  parameters: { visual: { viewport: { width: 360, height: 170 } } },
  render: () => (
    <Field disabled className="w-72">
      <FieldLabel>Stundensatz</FieldLabel>
      <InputGroup>
        <Input inputMode="decimal" defaultValue="95,00" className="text-right tabular-nums" />
        <InputGroupAddon>€ / Std.</InputGroupAddon>
      </InputGroup>
      <FieldDescription>Ist im Tarif Werkstatt festgelegt.</FieldDescription>
    </Field>
  ),
};

/** The three sizes. An inner button keeps 3px to the edge and the matching corner in each. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 360, height: 230 } } },
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <InputGroup key={size} size={size}>
          <InputGroupAddon>
            <Icon icon={Search01Icon} size={size === "sm" ? 14 : 16} />
          </InputGroupAddon>
          <Input aria-label="Kunden suchen" defaultValue="Schreinerei Mustermann" />
          <InputGroupButton aria-label="Passwort anzeigen">
            <Icon icon={ViewIcon} size={size === "sm" ? 14 : 16} />
          </InputGroupButton>
        </InputGroup>
      ))}
    </div>
  ),
};

/**
 * As a test: a press on the unit lands in the input, the reveal button is one Tab further and
 * toggles without taking the text away.
 */
export const Keyboard: Story = {
  render: () => <PasswordField />,
  play: async ({ canvas, userEvent, step }) => {
    const input = canvas.getByLabelText("Passwort");
    const reveal = canvas.getByRole("button", { name: "Passwort anzeigen" });

    await step("Tab reaches the input first, then the button", async () => {
      await userEvent.tab();
      await expect(input).toHaveFocus();
      await userEvent.tab();
      await expect(reveal).toHaveFocus();
    });

    await step("Space toggles the button and the input's type", async () => {
      await expect(input).toHaveAttribute("type", "password");
      await userEvent.keyboard(" ");
      await expect(reveal).toHaveAttribute("aria-pressed", "true");
      await expect(input).toHaveAttribute("type", "text");
      await expect(input).toHaveValue("werkstatt-2026");
      await userEvent.keyboard(" ");
      await expect(reveal).toHaveAttribute("aria-pressed", "false");
      await expect(input).toHaveAttribute("type", "password");
    });
  },
};
