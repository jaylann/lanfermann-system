import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { FigureRow } from "./figure-row";
import { FigureRowExample } from "./figure-row.example";

const meta = {
  title: "Slides/FigureRow",
  component: FigureRow,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof FigureRow>;

export default meta;
type Story = StoryObj;

/** Three figures at 108px under 2px rules: unit, label and source each, the first in the accent. */
export const Default: Story = {
  render: () => <FigureRowExample />,
};
