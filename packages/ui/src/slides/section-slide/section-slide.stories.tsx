import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { SectionSlide } from "./section-slide";
import { SectionSlideExample } from "./section-slide.example";

const meta = {
  title: "Slides/SectionSlide",
  component: SectionSlide,
  decorators: [onStage],
  parameters: slideParameters,
  args: { title: "Was Ihre Website über Sie sagt." },
} satisfies Meta<typeof SectionSlide>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A part opener with the arc, and the discs that say where the deck is. */
export const Default: Story = {
  render: () => <SectionSlideExample />,
};

/** The third part takes the halo. */
export const Halo: Story = {
  render: () => (
    <SectionSlide
      forms="halo"
      deck="Der digitale Handschlag"
      page={11}
      part={3}
      parts={4}
      title="Was sich ändern lässt."
      lead={
        <>
          Drei Eingriffe, nach Aufwand sortiert,
          <br />
          jeder mit seinem Preis.
        </>
      }
    />
  ),
};

/** The last part takes the orbit. */
export const Orbit: Story = {
  render: () => (
    <SectionSlide
      forms="orbit"
      deck="Der digitale Handschlag"
      page={15}
      part={4}
      parts={4}
      title="Wie es weitergeht."
      lead={
        <>
          Vier Wochen von der Analyse
          <br />
          bis zur neuen Seite.
        </>
      }
    />
  ),
};
