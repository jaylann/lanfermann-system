import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { TableOfContents, type TocItem } from "./table-of-contents";

const sections: TocItem[] = [
  { id: "vorbereitung", label: "Bevor du beginnst" },
  { id: "eintragen", label: "1. Den Server im Client eintragen" },
  { id: "frage", label: "2. Eine erste Frage stellen" },
  { id: "schreiben", label: "3. Schreiben freischalten, zuerst im Probelauf" },
  { id: "token", label: "4. Das Token sicher aufbewahren" },
  { id: "schluesselbund", label: "Im Schlüsselbund", depth: 3 },
  { id: "datei", label: "In einer Datei", depth: 3 },
  { id: "weiter", label: "Nächste Schritte" },
];

const meta = {
  title: "Components/TableOfContents",
  component: TableOfContents,
  args: { items: sections },
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 300, height: 380 }, target: '[data-slot="toc-link"]' },
  },
} satisfies Meta<typeof TableOfContents>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Beside the text, read up to the third section: the rail's piece stands by it. */
export const Default: Story = {
  args: { current: "schreiben", className: "w-56" },
};

/** Before the first heading nothing is marked. */
export const AtTheTop: Story = {
  args: { current: null, className: "w-56" },
};

/** Above the text on a narrow window: folded under its title. */
export const Collapsible: Story = {
  args: { collapsible: true, className: "w-80" },
  parameters: {
    visual: {
      viewport: { width: 380, height: 360 },
      motion: [{ name: "open", click: '[data-slot="collapsible-trigger"]', frames: 8 }],
    },
  },
};

/**
 * The keyboard path, as a test: the folded list opens with Enter, and its entries lead to the
 * sections.
 */
export const Keyboard: Story = {
  args: { collapsible: true },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Auf dieser Seite" });
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(canvas.getByRole("link", { name: "Bevor du beginnst" })).toBeVisible(),
    );
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Bevor du beginnst" })).toHaveAttribute(
      "href",
      "#vorbereitung",
    );
  },
};
