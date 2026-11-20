import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { expect, spyOn, waitFor } from "storybook/test";

import { CopyButton, type CopyButtonProps } from "./copy-button";

const link = "https://portal.lanfermann.dev/einladung/7f3k-92qa";

const meta = {
  title: "Components/CopyButton",
  component: CopyButton,
  args: { text: link, copyLabel: "Einladungslink kopieren" },
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 520, height: 150 },
      target: '[data-slot="copy-button"] button',
    },
  },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An address with its key beside it. The address is what gets selected if the copy is refused. */
function Address(props: Partial<CopyButtonProps>) {
  const shown = useRef<HTMLElement>(null);
  return (
    <div className="flex items-center gap-1">
      <code ref={shown} className="min-w-0 truncate font-mono text-sm text-fg-body">
        {link}
      </code>
      <CopyButton
        text={link}
        selectTarget={shown}
        copyLabel="Einladungslink kopieren"
        size="sm"
        {...props}
      />
    </div>
  );
}

/**
 * A square key beside what it copies. Press it: the symbol shrinks away, the tick draws itself,
 * and after a moment the symbol seats back.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [{ name: "copy", click: '[data-slot="copy-button"] button', frames: 8 }],
    },
  },
  render: () => <Address />,
};

/** With words, where the key stands on its own: the words stay, the symbol confirms. */
export const WithWords: Story = {
  parameters: {
    visual: {
      motion: [{ name: "copy", click: '[data-slot="copy-button"] button', frames: 8 }],
    },
  },
  render: (args) => (
    <CopyButton {...args} variant="secondary">
      Link kopieren
    </CopyButton>
  ),
};

/** The three sizes, quiet and raised. The symbol is 14, 16 and 18px. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 520, height: 190 } } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <CopyButton {...args} size="sm" />
        <CopyButton {...args} size="md" />
        <CopyButton {...args} size="lg" />
      </div>
      <div className="flex items-center gap-3">
        <CopyButton {...args} size="sm" variant="secondary" />
        <CopyButton {...args} size="md" variant="secondary" />
        <CopyButton {...args} size="lg" variant="secondary" />
        <CopyButton {...args} disabled variant="secondary" />
      </div>
    </div>
  ),
};

/**
 * The keyboard path, as a test: Tab reaches the key, Enter copies the text, and a screen reader
 * hears it once.
 */
export const Keyboard: Story = {
  render: () => <Address />,
  play: async ({ canvas, userEvent }) => {
    // The clipboard writes nowhere; the spy says what would have been copied.
    const write = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      await userEvent.tab();
      const key = canvas.getByRole("button", { name: "Einladungslink kopieren" });
      await expect(key).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(write).toHaveBeenCalledOnce();
      await expect(write).toHaveBeenCalledWith(link);
      await waitFor(() =>
        expect(canvas.getByRole("status")).toHaveTextContent("In die Zwischenablage kopiert."),
      );
      await expect(key).toHaveFocus();
    } finally {
      write.mockRestore();
    }
  },
};

/**
 * A refused clipboard, as a test: the address is selected instead, so ⌘C still copies it, and
 * the key says what happened.
 */
export const Refused: Story = {
  tags: ["visual-skip"],
  render: () => <Address />,
  play: async ({ canvas, userEvent }) => {
    const write = spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    try {
      await userEvent.click(canvas.getByRole("button", { name: "Einladungslink kopieren" }));
      await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Nicht kopiert."));
      await expect(window.getSelection()?.toString()).toBe(link);
    } finally {
      write.mockRestore();
      window.getSelection()?.removeAllRanges();
    }
  },
};
