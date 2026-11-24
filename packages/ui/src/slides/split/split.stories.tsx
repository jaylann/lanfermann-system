import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Split } from "./split";
import { SplitExample } from "./split.example";

const meta = {
  title: "Slides/Split",
  component: Split,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Split>;

export default meta;
type Story = StoryObj<typeof Split>;

/** `6|6`: two halves with the 64px gutter between them, both on the bottom line. */
export const Default: Story = {
  render: () => <SplitExample />,
};
