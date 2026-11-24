import type { Meta as StoryMeta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Meta } from "./meta";
import { MetaExample } from "./meta.example";

const meta = {
  title: "Slides/Meta",
  component: Meta,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies StoryMeta<typeof Meta>;

export default meta;
type Story = StoryObj<typeof Meta>;

/** Two labels over the paragraphs they name, and a note in the same 24px muted text. */
export const Default: Story = {
  render: () => <MetaExample />,
};
