import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { BeforeAfter } from "./before-after";
import { BeforeAfterExample } from "./before-after.example";

const meta = {
  title: "Slides/BeforeAfter",
  component: BeforeAfter,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof BeforeAfter>;

export default meta;
type Story = StoryObj;

/** Two frames of six columns under their labels, one marker on the new side. */
export const Default: Story = {
  render: () => <BeforeAfterExample />,
};

/** At step 1: both pages stand from the start, marker 1 on the new side has appeared, marker 2 keeps its place unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={10}>
      <Title>Zwei Änderungen, vier Wochen später.</Title>
      <Spacer />
      <BeforeAfter
        before={{ url: "schreinerei-mustermann.de" }}
        after={{
          url: "schreinerei-mustermann.de",
          markers: [
            { n: 1, x: 640, y: 76, step: 1 },
            { n: 2, x: 320, y: 300, step: 2 },
          ],
        }}
      />
      <Source>Aufnahmen vom 1.7. und 1.8.2026, Desktop, 1440 px</Source>
    </Slide>
  ),
};
