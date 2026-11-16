import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Quote } from "./quote";

const meta = {
  title: "Components/Quote",
  component: Quote,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 640, height: 240 } },
  },
} satisfies Meta<typeof Quote>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A customer's sentence, quoted: on Tint, as wide as the words. */
export const Default: Story = {
  args: {
    label: "Kundin, Bäckerei Kornprobst",
    children: <p>Die Bestellung kam pünktlich an, und das Formular versteht jeder.</p>,
  },
};

/** Sentences to type to an assistant, each in its own bubble with a copy key. */
export const Prompts: Story = {
  args: { children: null },
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        "Welche Rechnungen sind überfällig, und um wie viel?",
        "Fasse Umsatz und Kosten pro Monat für dieses Jahr zusammen.",
        "Erstelle einen Rechnungsentwurf für <einen Kunden> über 2 Stunden Beratung zu 120 EUR pro Stunde.",
      ].map((text) => (
        <Quote key={text} copy={text} copyLabel="Prompt kopieren">
          <p>{text}</p>
        </Quote>
      ))}
    </div>
  ),
  parameters: {
    visual: {
      viewport: { width: 640, height: 280 },
      target: '[data-slot="code-copy"] button',
    },
  },
};

/** The keyboard path, as a test: the copy key is reached with Tab and confirms the copy. */
export const Keyboard: Story = {
  args: {
    copy: "Wie ist mein sevDesk-Konto eingerichtet?",
    copyLabel: "Prompt kopieren",
    children: <p>Wie ist mein sevDesk-Konto eingerichtet?</p>,
  },
  play: async ({ canvas, userEvent }) => {
    const key = canvas.getByRole("button", { name: "Prompt kopieren" });
    await userEvent.tab();
    await expect(key).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent(/kopiert|markiert/i));
  },
};
