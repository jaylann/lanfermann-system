import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Objections } from "./objections";
import { ObjectionsExample } from "./objections.example";

const meta = {
  title: "Slides/Objections",
  component: Objections,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Objections>;

export default meta;
type Story = StoryObj;

/** Three objections on Tint: the quote in italics on five columns, its answer upright on seven. */
export const Default: Story = {
  render: () => <ObjectionsExample />,
};
