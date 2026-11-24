import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { KeyValue } from "./key-value";
import { KeyValueExample } from "./key-value.example";

const meta = {
  title: "Slides/KeyValue",
  component: KeyValue,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof KeyValue>;

export default meta;
type Story = StoryObj;

/** The scope of an offer: terms on four columns, their descriptions on eight. */
export const Default: Story = {
  render: () => <KeyValueExample />,
};
