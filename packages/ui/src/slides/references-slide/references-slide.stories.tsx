import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { ReferencesSlide } from "./references-slide";
import { ReferencesSlideExample } from "./references-slide.example";

const meta = {
  title: "Slides/ReferencesSlide",
  component: ReferencesSlide,
  decorators: [onStage],
  parameters: slideParameters,
  args: { items: [] },
} satisfies Meta<typeof ReferencesSlide>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Publisher, title and year, one row per source. */
export const Default: Story = {
  render: () => <ReferencesSlideExample />,
};
