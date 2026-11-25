import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Figure } from "./figure";
import { FigureExample } from "./figure.example";

const meta = {
  title: "Slides/Figure",
  component: Figure,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Figure>;

export default meta;
type Story = StoryObj;

/** The hero figure at 243px in the accent, its unit beside it, the sentence it starts and the source under a line. */
export const Default: Story = {
  render: () => <FigureExample />,
};
