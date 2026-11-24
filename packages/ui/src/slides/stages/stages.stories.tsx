import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Stages } from "./stages";
import { StagesExample } from "./stages.example";

const meta = {
  title: "Slides/Stages",
  component: Stages,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Stages>;

export default meta;
type Story = StoryObj;

/** Four stages with three checkpoints, one return path under the row and the legend for both. */
export const Default: Story = {
  render: () => <StagesExample />,
};
