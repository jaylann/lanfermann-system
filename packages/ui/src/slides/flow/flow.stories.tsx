import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Flow } from "./flow";
import { FlowExample } from "./flow.example";

const meta = {
  title: "Slides/Flow",
  component: Flow,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Flow>;

export default meta;
type Story = StoryObj;

/** Four boxes joined by arrows, the third with the accent edge. */
export const Default: Story = {
  render: () => <FlowExample />,
};
