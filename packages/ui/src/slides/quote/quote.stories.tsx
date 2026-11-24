import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Quote } from "./quote";
import { QuoteExample } from "./quote.example";

const meta = {
  title: "Slides/Quote",
  component: Quote,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Quote>;

export default meta;
type Story = StoryObj;

/** On Tint with the corner forms: a customer's sentence at 72px on the bottom margin, name and role under a 2px rule. */
export const Default: Story = {
  render: () => <QuoteExample />,
};
