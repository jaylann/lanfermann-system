import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Profile } from "./profile";
import { ProfileExample } from "./profile.example";

const meta = {
  title: "Slides/Profile",
  component: Profile,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Profile>;

export default meta;
type Story = StoryObj;

/** Without a portrait file: the placeholder on four columns beside three facts under one rule. */
export const Default: Story = {
  render: () => <ProfileExample />,
};
