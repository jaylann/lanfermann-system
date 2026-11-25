import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Tag } from "./tag";
import { TagExample, TagsExample } from "./tag.example";

const meta = {
  title: "Slides/Tag",
  component: Tag,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof Tag>;

/** `Tag`: eight trades in a row, each a word in a hairline box with no fill. */
export const Default: Story = {
  render: () => <TagExample />,
};

/** `Tags`: the same boxes as one row with a muted label in front. */
export const Labelled: Story = {
  render: () => <TagsExample />,
};
