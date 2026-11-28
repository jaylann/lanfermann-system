import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { Form } from "@/components/form/form";

import {
  StoredSecretField,
  StoredSecretFieldKey,
  type StoredSecretFieldProps,
} from "./stored-secret-field";

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
 * empty for a new one; Escape, or leaving it empty, brings the stored one back.
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

/**
 * A key inside the field (`trailing` with a `StoredSecretFieldKey`): it comes once something is
 * typed, and the eye glides aside for it. For a form that wants its key inside the field; to
 * save the field by itself, `saveLabel` puts the key beside it.
 */
export const TrailingKey: Story = {
  parameters: {
    visual: {
      motion: [{ name: "type", click: "input", type: "lf_sig_8Hd2", frames: 8 }],
    },
  },
  render: () => (
    <Field className="w-96 max-w-full">
      <FieldLabel>Signatur-Secret</FieldLabel>
      <StoredSecretField
        ending={undefined}
        placeholder="Nicht gesetzt"
        trailing={<StoredSecretFieldKey variant="primary">Prüfen</StoredSecretFieldKey>}
      />
      <FieldDescription>Steht im Dashboard des Dienstes unter „Webhooks“.</FieldDescription>
    </Field>
  ),
};

/** As a test: the key in the field is out of reach while the field is empty, and there once typed. */
export const TrailingKeyAppears: Story = {
  render: () => (
    <StoredSecretField
      ending={undefined}
      aria-label="Secret"
      trailing={<StoredSecretFieldKey>Prüfen</StoredSecretFieldKey>}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByRole("button", { name: "Prüfen" })).toBeNull();
    await userEvent.type(canvas.getByLabelText("Secret"), "lf_sig_8Hd2");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Prüfen" })).toBeVisible());
    await userEvent.clear(canvas.getByLabelText("Secret"));
    await waitFor(() => expect(canvas.queryByRole("button", { name: "Prüfen" })).toBeNull());
  },
};

/**
 * Stored, but the server keeps no ending (a short secret, whose ending would give too much of it
 * away): discs only, as long as a row with an ending, and assistive tech hears „Gesetzt“.
 */
export const WithoutEnding: Story = {
  parameters: { visual: { viewport: { width: 460, height: 250 } } },
  render: () => (
    <div className="flex w-96 max-w-full flex-col gap-5">
      <Field>
        <FieldLabel>API-Schlüssel</FieldLabel>
        <StoredSecretField ending="4f2a" />
      </Field>
      <Field>
        <FieldLabel>PIN des Kartenlesers</FieldLabel>
        <StoredSecretField stored ending={undefined} />
        <FieldDescription>Zu kurz, um ein Ende zu zeigen.</FieldDescription>
      </Field>
    </div>
  ),
};

/** As a test: stored without an ending reads as set, keeps the Replace key and sends nothing. */
export const WithoutEndingSaid: Story = {
  render: () => <StoredSecretField stored ending={undefined} aria-label="PIN" />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("textbox", { name: "PIN" })).toHaveValue("Gesetzt");
    await userEvent.click(canvas.getByRole("button", { name: "Ersetzen" }));
    await waitFor(() => expect(canvas.getByLabelText("PIN")).toHaveValue(""));
  },
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

function WithSubmit() {
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
 * leaving the field empty keeps it too, and a new secret is sent under the field's name.
 */
export const Keyboard: Story = {
  render: () => <WithSubmit />,
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
      // While a new one is typed the field has no key of its own.
      await expect(canvas.queryByRole("button", { name: "Abbrechen" })).toBeNull();
      await expect(canvas.queryByRole("button", { name: "Ersetzen" })).toBeNull();
    });

    await step("Escape keeps the stored one and returns to the key", async () => {
      await userEvent.type(canvas.getByRole("textbox", { name: "Signatur-Secret" }), "halb");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvas.getByRole("button", { name: "Ersetzen" })).toHaveFocus());
      await expect(canvas.getByRole("textbox", { name: "Signatur-Secret" })).toHaveValue(
        "Gesetzt, endet auf 4f2a",
      );
    });

    await step("Leaving the field empty keeps the stored one", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(canvas.getByRole("textbox", { name: "Signatur-Secret" })).toHaveFocus(),
      );
      // To the eye first: that is still inside the field, which stays open.
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Anzeigen" })).toHaveFocus();
      await userEvent.tab();
      await waitFor(() =>
        expect(canvas.getByRole("textbox", { name: "Signatur-Secret" })).toHaveValue(
          "Gesetzt, endet auf 4f2a",
        ),
      );
      // The focus stays where the reader put it, not back on the key.
      await expect(canvas.getByRole("button", { name: "Ersetzen" })).not.toHaveFocus();
      canvas.getByRole("button", { name: "Ersetzen" }).focus();
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

/** How a story's save ends: through, or refused by the service. */
type Outcome = "through" | "refused";

/**
 * The field saving itself, as an app wires it: a form of one field, its Save key, a save that
 * takes `delay` ms and goes through or is refused. `prefill` types a new secret on mount, so a
 * still shows the key; `start` shows it saving from the first frame.
 */
function SaveFlow({
  ending: initialEnding = "4f2a",
  prefill,
  start = false,
  delay = 1200,
  outcome = "through",
  savedHold,
}: {
  ending?: string;
  prefill?: string;
  start?: boolean;
  delay?: number;
  outcome?: Outcome;
  savedHold?: number;
}) {
  const [ending, setEnding] = useState<string | undefined>(initialEnding);
  const [replacing, setReplacing] = useState(prefill !== undefined);
  // A story that starts saving stays there: it is a still of the spinner.
  const [saving, setSaving] = useState(start);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const form = useRef<HTMLFormElement>(null);

  const save = (secret: string | undefined) => {
    if (!secret) return;
    setErrors({});
    setSaved(false);
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (outcome === "refused") {
        setErrors({ secret: "Der Dienst hat das Secret abgelehnt. Es beginnt mit „whsec_“." });
        return;
      }
      setEnding(secret.slice(-4));
      setSaved(true);
    }, delay);
  };

  useEffect(() => {
    const entry = form.current?.querySelector<HTMLInputElement>("input[name='secret']");
    if (prefill === undefined || !entry) return;
    // Typed as a person would: React hears the change through the native setter.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(entry, prefill);
    entry.dispatchEvent(new Event("input", { bubbles: true }));
  }, [prefill]);

  return (
    <Form
      ref={form}
      className="w-96 max-w-full"
      errors={errors}
      onFormSubmit={(values: { secret?: string }) => save(values.secret)}
    >
      <Field name="secret">
        <FieldLabel>Signatur-Secret</FieldLabel>
        <StoredSecretField
          ending={ending}
          replacing={replacing}
          onReplacingChange={(next) => {
            setReplacing(next);
            if (next) setSaved(false);
          }}
          saveLabel="Speichern"
          saving={saving}
          saved={saved}
          savedHold={savedHold}
          placeholder={ending ? "Neues Secret" : "Nicht gesetzt"}
        />
        <FieldError />
        <FieldDescription>Anfragen mit dem alten Secret werden danach abgelehnt.</FieldDescription>
      </Field>
    </Form>
  );
}

const saveViewport = { viewport: { width: 460, height: 190 } };

/**
 * With its own Save key: once something is typed the key stands beside the field, and the
 * field's edge glides aside to make room for it.
 */
export const Save: Story = {
  name: "Speichern",
  parameters: {
    visual: {
      ...saveViewport,
      target: '[data-slot="stored-secret-field-save"] button',
      motion: [
        // The save begins: the label sinks away and the spinner seats in its place.
        { name: "save", click: '[data-slot="stored-secret-field-save"] button', frames: 8 },
      ],
    },
  },
  render: () => <SaveFlow prefill="whsec_8Hd2kQ93b7c1" />,
};

/** The key's room opening as the first character is typed, and closing when it is cleared. */
export const SaveAppears: Story = {
  name: "Speichern erscheint",
  parameters: {
    visual: {
      ...saveViewport,
      motion: [
        { name: "appear", click: '[data-secret-key="replace"]', type: "w", frames: 10 },
        {
          name: "clear",
          click: '[data-secret-key="replace"]',
          type: "w\b",
          frames: 10,
        },
      ],
    },
  },
  render: () => <SaveFlow />,
};

/** The save is under way: a spinner in the key, at the key's width, and the field holds still. */
export const Saving: Story = {
  name: "Wird gespeichert",
  parameters: { visual: saveViewport },
  render: () => <SaveFlow prefill="whsec_8Hd2kQ93b7c1" start />,
};

/**
 * It went through: the tick is drawn in the key. After the hold the key leaves and the field
 * turns back to the stored secret with its new ending.
 */
export const Saved: Story = {
  name: "Gespeichert",
  parameters: {
    visual: {
      ...saveViewport,
      motion: [
        // A quick save, so the spinner gives way to the tick within the strip.
        { name: "saved", click: '[data-slot="stored-secret-field-save"] button', frames: 12 },
      ],
    },
  },
  render: () => <SaveFlow prefill="whsec_8Hd2kQ93b7c1" delay={120} savedHold={600_000} />,
};

/** Nothing stored yet: the first secret is saved the same way. */
export const SaveFirst: Story = {
  name: "Erstes Secret speichern",
  parameters: { visual: saveViewport },
  render: () => <SaveFlow ending={undefined} prefill="whsec_8Hd2kQ93b7c1" />,
};

/**
 * The whole way, to try by hand: „Ersetzen“, type, „Speichern“. Switch whether the service takes
 * the secret, and how long the tick stands before the field turns back.
 */
export const SaveFlowStory: Story = {
  name: "Ablauf",
  parameters: { visual: { skip: true } },
  argTypes: {
    // These belong to the flow, not to the field.
    ...({
      outcome: {
        name: "Ausgang",
        options: ["through", "refused"],
        control: { type: "inline-radio", labels: { through: "Gespeichert", refused: "Abgelehnt" } },
      },
      savedHold: {
        name: "Haken steht (ms)",
        options: [600, 900, 1400],
        control: { type: "inline-radio" },
      },
    } as Meta["argTypes"]),
  },
  args: { outcome: "through", savedHold: 900 } as Partial<StoredSecretFieldProps>,
  render: (args) => {
    const { outcome, savedHold } = args as { outcome?: Outcome; savedHold?: number };
    return <SaveFlow key={`${outcome}-${savedHold}`} outcome={outcome} savedHold={savedHold} />;
  },
};

/**
 * As a test: typing brings the Save key, Enter saves, the key is busy while it runs and says
 * „Gespeichert“ to assistive tech when it went through; the field turns back with the new ending
 * and the focus on „Ersetzen“. A refused save leaves the key and the typed secret standing.
 */
export const SaveKeyboard: Story = {
  render: () => <SaveFlow delay={150} savedHold={300} />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    await step("Typing brings the Save key", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Ersetzen" }));
      const entry = canvas.getByRole("textbox", { name: "Signatur-Secret" });
      await waitFor(() => expect(entry).toHaveFocus());
      const room = canvasElement.querySelector('[data-slot="stored-secret-field-save"]');
      await expect(room).not.toHaveAttribute("data-shown");
      await userEvent.type(entry, "whsec_8Hd2kQ93b7c1");
      await expect(room).toHaveAttribute("data-shown");
    });

    await step("Enter saves; the key is busy, then says it went through", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(canvas.getByRole("button", { name: "Speichern" })).toHaveAttribute("aria-busy"),
      );
      await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Gespeichert"));
    });

    await step("The field turns back with the new ending and the focus on „Ersetzen“", async () => {
      await waitFor(() =>
        expect(canvas.getByRole("textbox", { name: "Signatur-Secret" })).toHaveValue(
          "Gesetzt, endet auf b7c1",
        ),
      );
      await waitFor(() => expect(canvas.getByRole("button", { name: "Ersetzen" })).toHaveFocus());
      await expect(
        canvasElement.querySelector('[data-slot="stored-secret-field-save"]'),
      ).not.toHaveAttribute("data-shown");
    });
  },
};
