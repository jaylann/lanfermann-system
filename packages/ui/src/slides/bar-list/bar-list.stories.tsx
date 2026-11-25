import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { BarList } from "./bar-list";
import { BarListExample } from "./bar-list.example";

const meta = {
  title: "Slides/BarList",
  component: BarList,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof BarList>;

export default meta;
type Story = StoryObj;

/** Three ranked bars across twelve columns: the labels on four, the values at the end, one bar in the accent. */
export const Default: Story = {
  render: () => <BarListExample />,
};
