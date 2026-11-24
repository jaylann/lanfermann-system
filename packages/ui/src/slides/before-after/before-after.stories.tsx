import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { BeforeAfter } from "./before-after";
import { BeforeAfterExample } from "./before-after.example";

const meta = {
  title: "Slides/BeforeAfter",
  component: BeforeAfter,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof BeforeAfter>;

export default meta;
type Story = StoryObj;

/** Two frames of six columns under their labels, one marker on the new side. */
export const Default: Story = {
  render: () => <BeforeAfterExample />,
};
