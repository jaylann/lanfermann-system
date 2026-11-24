import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, spyOn, waitFor } from "storybook/test";

import { CopyField } from "./copy-field";

const ADDRESS = "https://cdn.lanfermann.de/kunden/schreinerei-huber/angebot-kueche.pdf";

const meta = {
  title: "Components/CopyField",
  component: CopyField,
  parameters: {
    visual: {
      viewport: { width: 420, height: 150 },
      target: '[data-slot="copy-field"]',
      motion: [{ name: "copy", click: '[data-slot="copy-field"]', frames: 8 }],
    },
  },
} satisfies Meta<typeof CopyField>;

export default meta;
type Story = StoryObj;

/** An address too long for its place: cut in the middle, the file's name stays. */
export const Default: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <CopyField value={ADDRESS} label="Adresse kopieren" />
      <CopyField
        value="![angebot-kueche.pdf](https://cdn.lanfermann.de/kunden/angebot-kueche.pdf)"
        label="Als Markdown kopieren"
      />
    </div>
  ),
};

/** `sm` in a dense panel, `md` (the default) beside other `md` controls. */
export const Sizes: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <CopyField size="sm" value={ADDRESS} label="Adresse kopieren" />
      <CopyField size="md" value={ADDRESS} label="Adresse kopieren" />
    </div>
  ),
};

const copied = fn();

/** The keyboard path, as a test: the field is one key, Enter copies and confirms it. */
export const Keyboard: Story = {
  render: () => (
    <div className="w-80">
      <CopyField value={ADDRESS} label="Adresse kopieren" onCopied={copied} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    copied.mockClear();
    // The clipboard writes nowhere; the spy says what would have been copied.
    const write = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      await userEvent.tab();
      const key = canvas.getByRole("button", { name: /^Adresse kopieren/ });
      await expect(key).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(key).toHaveAttribute("data-state", "copied"));
      await expect(write).toHaveBeenCalledWith(ADDRESS);
      await expect(copied).toHaveBeenCalledTimes(1);
      await expect(canvas.getByRole("status")).toHaveTextContent("In die Zwischenablage kopiert.");
    } finally {
      write.mockRestore();
    }
  },
};
