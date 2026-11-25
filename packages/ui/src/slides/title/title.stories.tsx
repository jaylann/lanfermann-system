import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Title } from "./title";
import { TitleExample } from "./title.example";

const meta = {
  title: "Slides/Title",
  component: Title,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Title>;

export default meta;
type Story = StoryObj<typeof Title>;

/**
 * At 72px on a content slide, with its lead: two lines, broken after the comma. The statement
 * and cover sizes are drawn in `Slides/Forms` and `Slides/Wordmark`.
 */
export const Default: Story = {
  render: () => <TitleExample />,
};
