import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Tiers } from "./tiers";
import { TiersExample } from "./tiers.example";

const meta = {
  title: "Slides/Tiers",
  component: Tiers,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Tiers>;

export default meta;
type Story = StoryObj;

/** Three offers as ruled columns: name, price at 72px, what is included; one price in the accent. */
export const Default: Story = {
  render: () => <TiersExample />,
};
