import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { List } from "./list";
import { ListExample } from "./list.example";

const meta = {
  title: "Slides/List",
  component: List,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj;

/** Four plain rows under one rule, each opened by a few bold words. */
export const Default: Story = {
  render: () => <ListExample />,
};
