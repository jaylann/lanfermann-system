import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, spyOn, waitFor } from "storybook/test";

import { Field, FieldDescription, FieldLabel } from "@/components/field/field";

import { SecretField, type SecretFieldProps } from "./secret-field";

const key = "lf_live_9fK2mQ7xLr4TzVb81NcYd3Ha";

const meta = {
  title: "Components/SecretField",
  component: SecretField,
  args: { value: key },
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 460, height: 170 },
      target: '[data-secret-key="reveal"]',
    },
  },
} satisfies Meta<typeof SecretField>;

export default meta;
type Story = StoryObj<typeof meta>;

function Secret(props: Partial<SecretFieldProps>) {
  return (
    <Field className="w-96 max-w-full">
      <FieldLabel>Geheimer Schlüssel</FieldLabel>
      <SecretField value={key} {...props} />
      <FieldDescription>Er wird nur dieses eine Mal angezeigt.</FieldDescription>
    </Field>
  );
}

/**
 * Hidden behind discs. The key with the eye shows the value, the second one copies it, hidden
 * or not.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "reveal", click: '[data-secret-key="reveal"]', frames: 8 },
        { name: "copy", click: '[data-secret-key="copy"]', frames: 8 },
      ],
    },
  },
  render: () => <Secret />,
};

/** Shown: the value in mono, and the eye is struck through. */
export const Revealed: Story = {
  render: () => <Secret defaultRevealed />,
};

/** `visibleStart={8}`: the prefix that says what kind of key it is stays readable. */
export const WithPrefix: Story = {
  render: () => <Secret visibleStart={8} />,
};

/** `hideable={false}`: not a secret, only something to copy. An invitation link. */
export const Link: Story = {
  parameters: { visual: { target: '[data-secret-key="copy"]' } },
  render: () => (
    <Field className="w-96 max-w-full">
      <FieldLabel>Einladungslink</FieldLabel>
      <SecretField
        hideable={false}
        value="https://portal.lanfermann.dev/einladung/7f3k-92qa"
        copyLabel="Link kopieren"
      />
      <FieldDescription>Wer den Link hat, kann dem Arbeitsbereich beitreten.</FieldDescription>
    </Field>
  ),
};

/** The three sizes. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 460, height: 210 } } },
  render: (args) => (
    <div className="flex w-96 max-w-full flex-col gap-3">
      <SecretField {...args} size="sm" aria-label="Schlüssel, klein" visibleStart={8} />
      <SecretField {...args} size="md" aria-label="Schlüssel" visibleStart={8} />
      <SecretField {...args} size="lg" aria-label="Schlüssel, groß" visibleStart={8} />
    </div>
  ),
};

/** On a phone the field is as wide as the page, and a long value ends in an ellipsis. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 170 } } },
  render: () => <Secret defaultRevealed />,
};

/**
 * The keyboard path, as a test: the field is read-only and hides its value from the page, the
 * eye is a toggle, and the copy takes the real value while it is still hidden.
 */
export const Keyboard: Story = {
  args: { onFocus: fn() },
  render: (args) => <Secret visibleStart={8} onFocus={args.onFocus} />,
  play: async ({ args, canvas, userEvent, step }) => {
    const write = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const field = canvas.getByRole<HTMLInputElement>("textbox", { name: "Geheimer Schlüssel" });
    try {
      await step("hidden, the value is not in the page", async () => {
        await expect(field).toHaveAttribute("readonly");
        await expect(field.value.startsWith("lf_live_•")).toBe(true);
        await expect(field.value).not.toContain("9fK2");
      });

      await step("the copy takes the real value while it is hidden", async () => {
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.tab();
        await expect(canvas.getByRole("button", { name: "Kopieren" })).toHaveFocus();
        await userEvent.keyboard("{Enter}");
        await expect(write).toHaveBeenCalledWith(key);
        await waitFor(() =>
          expect(canvas.getByRole("status")).toHaveTextContent("In die Zwischenablage kopiert."),
        );
        await expect(field.value).not.toContain("9fK2");
      });

      await step("the eye is a toggle that shows and hides the value", async () => {
        const eye = canvas.getByRole("button", { name: "Anzeigen" });
        await expect(eye).toHaveAttribute("aria-pressed", "false");
        await userEvent.click(eye);
        await expect(eye).toHaveAttribute("aria-pressed", "true");
        await expect(field).toHaveValue(key);
        await userEvent.click(eye);
        await expect(field.value).not.toContain("9fK2");
      });

      await step(
        "shown, the focus takes the whole value, beside a caller's own onFocus",
        async () => {
          await userEvent.click(canvas.getByRole("button", { name: "Anzeigen" }));
          field.focus();
          await expect(field).toHaveFocus();
          await expect(field.selectionStart).toBe(0);
          await expect(field.selectionEnd).toBe(key.length);
          await expect(args.onFocus).toHaveBeenCalled();
        },
      );
    } finally {
      write.mockRestore();
    }
  },
};

/**
 * A refused clipboard, as a test: the value is shown and selected instead, so ⌘C still copies
 * it, and the field says so.
 */
export const Refused: Story = {
  tags: ["visual-skip"],
  render: () => <Secret />,
  play: async ({ canvas, userEvent }) => {
    const write = spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    const field = canvas.getByRole<HTMLInputElement>("textbox", { name: "Geheimer Schlüssel" });
    try {
      await userEvent.click(canvas.getByRole("button", { name: "Kopieren" }));
      await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Nicht kopiert."));
      await expect(field).toHaveValue(key);
      await expect(field.selectionStart).toBe(0);
      await expect(field.selectionEnd).toBe(key.length);
    } finally {
      write.mockRestore();
    }
  },
};
