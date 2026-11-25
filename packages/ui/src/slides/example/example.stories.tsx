import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { Example } from "./example";
import { ExampleExample } from "./example.example";

const meta = {
  title: "Slides/Example",
  component: Example,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj;

/** On Ink: the label, a user's sentence at 48px, the call it becomes as code on the quiet surface, and the model under it. */
export const Default: Story = {
  render: () => <ExampleExample />,
};
