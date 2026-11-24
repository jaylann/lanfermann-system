import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Findings } from "./findings";
import { FindingsExample } from "./findings.example";

const meta = {
  title: "Slides/Findings",
  component: Findings,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Findings>;

export default meta;
type Story = StoryObj;

/** Three numbered findings on five columns, each with the line that says why it matters. */
export const Default: Story = {
  render: () => <FindingsExample />,
};
