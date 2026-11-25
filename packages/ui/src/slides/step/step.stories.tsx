import type { Meta, StoryObj } from "@storybook/react-vite";

import { atStep, onStage, slideParameters } from "@/slides/story-slide";

import { Step } from "./step";
import { StepExample } from "./step.example";

// One slide that builds in two steps. The stories show it standing still at one step each.
const meta = {
  title: "Slides/Step",
  component: Step,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Step>;

export default meta;
type Story = StoryObj<typeof Step>;

/** Every step shown, as a print, a preview and the check see the slide. */
export const Default: Story = {
  render: () => <StepExample />,
};

/** At the first step: the remedy has appeared, the conclusion keeps its place unseen. */
export const AtStepOne: Story = {
  render: () => <StepExample />,
  decorators: [atStep(1, 2)],
};

/** At the second and last step: the whole slide. */
export const AtStepTwo: Story = {
  render: () => <StepExample />,
  decorators: [atStep(2)],
};
