import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Diagram } from "./diagram";
import { DiagramExample } from "./diagram.example";

const meta = {
  title: "Slides/Diagram",
  component: Diagram,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Diagram>;

export default meta;
type Story = StoryObj;

/** An architecture in three columns under column heads, with one accent box and one dashed path. */
export const Default: Story = {
  render: () => <DiagramExample />,
};
