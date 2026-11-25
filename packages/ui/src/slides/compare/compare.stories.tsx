import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Compare } from "./compare";
import { CompareExample } from "./compare.example";

const meta = {
  title: "Slides/Compare",
  component: Compare,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Compare>;

export default meta;
type Story = StoryObj;

/** Today beside the proposal: the left column muted, the right in the text colour, lines open at the gutter. */
export const Default: Story = {
  render: () => <CompareExample />,
};
