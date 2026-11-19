import { PinIcon, StarIcon, TextWrapIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Icon } from "@/components/icon/icon";

import { Toggle } from "./toggle";

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  parameters: {
    visual: {
      viewport: { width: 460, height: 130 },
      target: '[data-slot="toggle"]',
      motion: [{ name: "press", click: '[data-slot="toggle"]', frames: 6 }],
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A key with two states. Press it and it stays down; press it again and it seats back. */
export const Default: Story = {
  render: () => (
    <Toggle>
      <Icon icon={PinIcon} size={16} />
      Anheften
    </Toggle>
  ),
};

/** Down: the face is shaded, the gloss and the shadow are gone. */
export const Pressed: Story = {
  render: () => (
    <Toggle defaultPressed>
      <Icon icon={PinIcon} size={16} />
      Anheften
    </Toggle>
  ),
};

/**
 * `variant="quiet"`: no face. Off, the symbol is muted; on, it is dark and keeps the wash a
 * quiet key has under the pointer.
 */
export const Quiet: Story = {
  render: () => (
    <div className="flex items-center gap-1">
      <Toggle variant="quiet" iconOnly aria-label="Als wichtig markieren">
        <Icon icon={StarIcon} size={16} />
      </Toggle>
      <Toggle variant="quiet" iconOnly aria-label="Zeilen umbrechen" defaultPressed>
        <Icon icon={TextWrapIcon} size={16} />
      </Toggle>
      <Toggle variant="quiet" defaultPressed>
        <Icon icon={PinIcon} size={16} />
        Angeheftet
      </Toggle>
    </div>
  ),
};

/** The three sizes, up and down. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 460, height: 190 } } },
  render: () => (
    <div className="flex flex-col gap-4">
      {([false, true] as const).map((pressed) => (
        <div key={String(pressed)} className="flex items-center gap-3">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Toggle key={size} size={size} defaultPressed={pressed}>
              <Icon icon={PinIcon} size={{ sm: 14, md: 16, lg: 18 }[size]} />
              Anheften
            </Toggle>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** It cannot be changed right now: flat, and it still says which state it is in. */
export const Disabled: Story = {
  parameters: { visual: { motion: [] } },
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle disabled>
        <Icon icon={PinIcon} size={16} />
        Anheften
      </Toggle>
      <Toggle disabled defaultPressed>
        <Icon icon={PinIcon} size={16} />
        Anheften
      </Toggle>
    </div>
  ),
};

/**
 * The keyboard path, as a test: Tab reaches the key, Space and Enter change it, and it says
 * which state it is in.
 */
export const Keyboard: Story = {
  args: { onPressedChange: fn() },
  render: (args) => (
    <Toggle onPressedChange={args.onPressedChange}>
      <Icon icon={PinIcon} size={16} />
      Anheften
    </Toggle>
  ),
  play: async ({ args, canvas, userEvent }) => {
    const key = canvas.getByRole("button", { name: "Anheften" });
    await userEvent.tab();
    await expect(key).toHaveFocus();
    await expect(key).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(key).toHaveAttribute("aria-pressed", "true");
    await expect(args.onPressedChange).toHaveBeenLastCalledWith(true, expect.anything());
    await userEvent.keyboard("{Enter}");
    await expect(key).toHaveAttribute("aria-pressed", "false");
    await expect(key).toHaveFocus();
  },
};
