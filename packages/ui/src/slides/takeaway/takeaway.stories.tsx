import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Takeaway } from "./takeaway";
import { TakeawayExample } from "./takeaway.example";

const meta = {
  title: "Slides/Takeaway",
  component: Takeaway,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Takeaway>;

export default meta;
type Story = StoryObj<typeof Takeaway>;

/** One 48px sentence under the 2px rule, across the measure at the foot of the slide. */
export const Default: Story = {
  render: () => <TakeawayExample />,
};
