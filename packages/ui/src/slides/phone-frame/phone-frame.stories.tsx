import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { PhoneFrame } from "./phone-frame";
import { PhoneFrameExample } from "./phone-frame.example";

const meta = {
  title: "Slides/PhoneFrame",
  component: PhoneFrame,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof PhoneFrame>;

export default meta;
type Story = StoryObj;

/** Without a screenshot: the compact wireframe in the bezel, two markers and their findings. */
export const Default: Story = {
  render: () => <PhoneFrameExample />,
};
