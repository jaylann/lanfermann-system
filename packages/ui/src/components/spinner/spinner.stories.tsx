import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "./spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: { visual: { viewport: { width: 460, height: 110 } } },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** It takes the text colour of its context and the icon size of the control it sits in. */
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-6 text-fg">
      <Spinner size={14} />
      <Spinner />
      <Spinner size={18} />
      <span className="flex items-center gap-2 text-control text-fg-muted">
        <Spinner label="Angebote werden geladen" />
        Angebote werden geladen …
      </span>
    </div>
  ),
};
