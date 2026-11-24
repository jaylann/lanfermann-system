import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Columns } from "./columns";
import { ColumnsExample } from "./columns.example";

const meta = {
  title: "Slides/Columns",
  component: Columns,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Columns>;

export default meta;
type Story = StoryObj;

/** Three services as columns under rules: a 40px icon before each 48px title, the text at 32px. */
export const Default: Story = {
  render: () => <ColumnsExample />,
};
