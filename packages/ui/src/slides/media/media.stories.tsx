import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Media } from "./media";
import { MediaExample } from "./media.example";

const meta = {
  title: "Slides/Media",
  component: Media,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Media>;

export default meta;
type Story = StoryObj;

/** Without an image: the frame holds the note on what to photograph, the caption stands under it. */
export const Default: Story = {
  render: () => <MediaExample />,
};
