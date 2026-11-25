import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Loop } from "./loop";
import { LoopExample } from "./loop.example";

const meta = {
  title: "Slides/Loop",
  component: Loop,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Loop>;

export default meta;
type Story = StoryObj;

/** Eight steps around a rectangle with one round in the middle, beside two numbered findings. */
export const Default: Story = {
  render: () => <LoopExample />,
};
