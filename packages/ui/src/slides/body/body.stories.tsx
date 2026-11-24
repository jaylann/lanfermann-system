import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Body } from "./body";
import { BodyExample } from "./body.example";

const meta = {
  title: "Slides/Body",
  component: Body,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Body>;

export default meta;
type Story = StoryObj<typeof Body>;

/** Three lines at 32px on six columns, the one sentence that must not be missed in bold. */
export const Default: Story = {
  render: () => <BodyExample />,
};
