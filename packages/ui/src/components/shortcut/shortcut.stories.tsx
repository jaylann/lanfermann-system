import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";

import { Input } from "@/components/input/input";

import { Shortcut, ShortcutProvider, useShortcut } from "./shortcut";

const meta = {
  title: "Components/Shortcut",
  component: Shortcut,
  args: { keys: "mod+k" },
  parameters: { visual: { viewport: { width: 520, height: 230 } } },
} satisfies Meta<typeof Shortcut>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  { label: "Suchen", keys: "mod+k" },
  { label: "Seitenleiste einklappen", keys: "mod+b" },
  { label: "Angebot senden", keys: "mod+enter" },
  { label: "Befehle anzeigen", keys: "mod+shift+p" },
  { label: "Schließen", keys: "esc" },
];

function Rows({ platform }: { platform: "apple" | "other" }) {
  return (
    <dl className="flex w-56 flex-col gap-2.5 text-control text-fg-body">
      {rows.map((row) => (
        <div key={row.keys} className="flex items-center justify-between gap-4">
          <dt>{row.label}</dt>
          <dd>
            <Shortcut keys={row.keys} platform={platform} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The same shortcuts on the two kinds of keyboard: an Apple one, and every other. */
export const Platforms: Story = {
  render: () => (
    <div className="flex items-start gap-10">
      <Rows platform="apple" />
      <Rows platform="other" />
    </div>
  ),
};

/**
 * As the reader's own keyboard has it. The picture depends on the machine that draws it, so it
 * is not captured.
 */
export const Detected: Story = {
  tags: ["visual-skip"],
  render: (args) => (
    <span className="flex items-center gap-3 text-control text-fg-body">
      Suchen <Shortcut {...args} />
    </span>
  ),
};

function Listener() {
  const [searches, setSearches] = useState(0);
  const [slashes, setSlashes] = useState(0);
  useShortcut("mod+k", () => setSearches((count) => count + 1));
  useShortcut("/", () => setSlashes((count) => count + 1));
  return (
    <div className="flex w-64 flex-col gap-3 text-control text-fg-body">
      <Input aria-label="Notiz" placeholder="z. B. Rückruf am Freitag" />
      <p className="flex items-center justify-between">
        Suche geöffnet <Shortcut keys="mod+k" />
        <output aria-label="Suche geöffnet" className="tabular-nums">
          {searches}
        </output>
      </p>
      <p className="flex items-center justify-between">
        Filter geöffnet <Shortcut keys="/" />
        <output aria-label="Filter geöffnet" className="tabular-nums">
          {slashes}
        </output>
      </p>
    </div>
  );
}

/** `useShortcut` listens in the whole window. A plain key waits while a field is typed into. */
export const Keyboard: Story = {
  render: () => (
    <ShortcutProvider platform="other">
      <Listener />
    </ShortcutProvider>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const searches = canvas.getByRole("status", { name: "Suche geöffnet" });
    const slashes = canvas.getByRole("status", { name: "Filter geöffnet" });
    const field = canvas.getByRole("textbox", { name: "Notiz" });

    await step("Strg and K is the shortcut on this keyboard; K alone is not", async () => {
      await userEvent.keyboard("k");
      await expect(searches).toHaveTextContent("0");
      await userEvent.keyboard("{Control>}k{/Control}");
      await expect(searches).toHaveTextContent("1");
    });

    await step("a plain key answers on the page", async () => {
      await userEvent.keyboard("/");
      await expect(slashes).toHaveTextContent("1");
    });

    await step("typed into a field, the plain key is a character", async () => {
      await userEvent.click(field);
      await userEvent.keyboard("3/4");
      await expect(field).toHaveValue("3/4");
      await expect(slashes).toHaveTextContent("1");
    });

    await step("a command still answers from inside the field", async () => {
      await userEvent.keyboard("{Control>}k{/Control}");
      await expect(searches).toHaveTextContent("2");
    });
  },
};
