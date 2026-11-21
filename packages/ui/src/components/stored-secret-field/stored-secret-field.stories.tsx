import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldLabel } from "@/components/field/field";
import { Form } from "@/components/form/form";

import { StoredSecretField, type StoredSecretFieldProps } from "./stored-secret-field";

const meta = {
  title: "Components/StoredSecretField",
  component: StoredSecretField,
  args: { ending: "4f2a" },
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 460, height: 170 },
      target: '[data-secret-key="replace"]',
    },
  },
} satisfies Meta<typeof StoredSecretField>;

export default meta;
type Story = StoryObj<typeof meta>;

function Stored({
  description = "Anfragen mit dem alten Secret werden danach abgelehnt.",
  ...props
}: Partial<StoredSecretFieldProps> & { description?: string }) {
  return (
    <Field className="w-96 max-w-full">
      <FieldLabel>Signatur-Secret</FieldLabel>
      <StoredSecretField ending="4f2a" {...props} />
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}

/**
 * Stored: discs with the end kept, so it is told apart from another. „Ersetzen“ makes the field
 * empty for a new one, and the key turns into „Abbrechen“ in its place.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "replace", click: '[data-secret-key="replace"]', frames: 8 },
        // A new secret typed into the field that opened: discs, in every engine.
        {
          name: "type",
          click: '[data-secret-key="replace"]',
          type: "lf_sig_8Hd2kQ93b7c1",
          frames: 4,
        },
      ],
    },
  },
  render: () => <Stored />,
};

/** A new one being typed: behind discs, which the eye shows. */
export const Replacing: Story = {
  render: () => <Stored defaultReplacing />,
};

/** Nothing stored yet: the field takes a first one, and there is nothing to keep. */
export const NotSet: Story = {
  render: () => (
    <Stored ending={undefined} description="Steht im Dashboard des Dienstes unter „Webhooks“." />
  ),
};

/** The three sizes. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 460, height: 210 } } },
  render: (args) => (
    <div className="flex w-96 max-w-full flex-col gap-3">
      <StoredSecretField {...args} size="sm" aria-label="Secret, klein" />
      <StoredSecretField {...args} size="md" aria-label="Secret" />
      <StoredSecretField {...args} size="lg" aria-label="Secret, groß" />
    </div>
  ),
};

/** On a phone the field is as wide as the page. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 170 } } },
  render: () => <Stored />,
};

function Saving() {
  const [ending, setEnding] = useState("4f2a");
  const [sent, setSent] = useState("nichts gesendet");
  const [replacing, setReplacing] = useState(false);
  return (
    <Form
      className="w-96 max-w-full"
      onFormSubmit={(values: { secret?: string }) => {
        setSent(values.secret === undefined ? "ohne Secret" : `Secret: ${values.secret}`);
        if (values.secret) {
          setEnding(values.secret.slice(-4));
          setReplacing(false);
        }
      }}
    >
      <Field name="secret">
        <FieldLabel>Signatur-Secret</FieldLabel>
        <StoredSecretField ending={ending} replacing={replacing} onReplacingChange={setReplacing} />
        <FieldDescription>
          Gesendet: <span data-testid="sent">{sent}</span>
        </FieldDescription>
      </Field>
      <Button type="submit" variant="primary" className="self-start">
        Speichern
      </Button>
    </Form>
  );
}

/**
 * As a test: the stored secret is read out with its ending and sends nothing; „Ersetzen“ moves
 * the focus into an empty field, Escape keeps the stored one and returns the focus to the key,
 * and a new secret is sent under the field's name.
 */
export const Keyboard: Story = {
  render: () => <Saving />,
  play: async ({ canvas, userEvent, step }) => {
    const sent = canvas.getByTestId("sent");
    const save = canvas.getByRole("button", { name: "Speichern" });

    await step("Stored, it is read out with its ending and sends nothing", async () => {
      const field = canvas.getByRole("textbox", { name: "Signatur-Secret" });
      await expect(field).toHaveValue("Gesetzt, endet auf 4f2a");
      await expect(field).toHaveAttribute("readonly");
      await expect(field).not.toHaveAttribute("name");
      await userEvent.click(save);
      await waitFor(() => expect(sent).toHaveTextContent("ohne Secret"));
    });

    await step("„Ersetzen“ opens an empty field with the focus", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Ersetzen" }));
      const entry = canvas.getByRole("textbox", { name: "Signatur-Secret" });
      await waitFor(() => expect(entry).toHaveFocus());
      await expect(entry).toHaveValue("");
      await expect(canvas.getByRole("button", { name: "Abbrechen" })).toBeVisible();
    });

    await step("Escape keeps the stored one and returns to the key", async () => {
      await userEvent.type(canvas.getByRole("textbox", { name: "Signatur-Secret" }), "halb");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvas.getByRole("button", { name: "Ersetzen" })).toHaveFocus());
      await expect(canvas.getByRole("textbox", { name: "Signatur-Secret" })).toHaveValue(
        "Gesetzt, endet auf 4f2a",
      );
    });

    await step("A new secret is sent under the field's name", async () => {
      await userEvent.keyboard("{Enter}");
      const entry = canvas.getByRole("textbox", { name: "Signatur-Secret" });
      await waitFor(() => expect(entry).toHaveFocus());
      await userEvent.type(entry, "lf_sig_8Hd2kQ93b7c1");
      await userEvent.click(canvas.getByRole("button", { name: "Anzeigen" }));
      await expect(entry).toHaveValue("lf_sig_8Hd2kQ93b7c1");
      await userEvent.click(save);
      await waitFor(() => expect(sent).toHaveTextContent("Secret: lf_sig_8Hd2kQ93b7c1"));
      await waitFor(() =>
        expect(canvas.getByRole("textbox", { name: "Signatur-Secret" })).toHaveValue(
          "Gesetzt, endet auf b7c1",
        ),
      );
    });
  },
};
