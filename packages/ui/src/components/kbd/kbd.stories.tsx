import type { Meta, StoryObj } from "@storybook/react-vite";

import { Kbd } from "./kbd";

const meta = {
  title: "Components/Kbd",
  component: Kbd,
  parameters: { visual: { viewport: { width: 420, height: 110 } } },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One key per cap, keys of a shortcut side by side. */
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-8 text-control text-fg-body">
      <span className="flex items-center gap-2">
        Suchen
        <span className="flex gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </span>
      <span className="flex items-center gap-2">
        Schließen <Kbd>Esc</Kbd>
      </span>
      <span className="flex items-center gap-2">
        Senden
        <span className="flex gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>↵</Kbd>
        </span>
      </span>
    </div>
  ),
};
