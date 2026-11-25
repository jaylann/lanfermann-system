import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Code } from "./code";
import { CodeExample } from "./code.example";

const meta = {
  title: "Slides/Code",
  component: Code,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj;

/** Six lines of JSON on the quiet surface, indentation kept, the second line in the accent, a caption under the block. */
export const Default: Story = {
  render: () => <CodeExample />,
};
