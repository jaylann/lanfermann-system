import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Steps } from "./steps";
import { StepsExample } from "./steps.example";

const meta = {
  title: "Slides/Steps",
  component: Steps,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj;

/** Four steps in the small setting: the week as the label, a 32px strong title, the text at 24px. */
export const Default: Story = {
  render: () => <StepsExample />,
};
