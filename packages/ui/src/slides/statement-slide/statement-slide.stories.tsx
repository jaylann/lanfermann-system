import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { StatementSlide } from "./statement-slide";
import { StatementSlideExample } from "./statement-slide.example";

const meta = {
  title: "Slides/StatementSlide",
  component: StatementSlide,
  decorators: [onStage],
  parameters: slideParameters,
  args: { children: "Vertrauen entsteht, bevor das Telefon klingelt." },
} satisfies Meta<typeof StatementSlide>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One sentence at 108px with the indigo half on the right edge. */
export const Default: Story = {
  render: () => <StatementSlideExample />,
};

/** A second statement in the same deck takes the halo. */
export const Halo: Story = {
  render: () => (
    <StatementSlide forms="halo" deck="Der digitale Handschlag" page={14}>
      Eine Seite, die lädt,
      <br />
      ist schon die halbe Miete.
    </StatementSlide>
  ),
};

/** A claim that rests on a source carries it at the foot. */
export const WithSource: Story = {
  render: () => (
    <StatementSlide
      deck="Der digitale Handschlag"
      page={3}
      source="Quelle: BrightLocal, Local Consumer Review Survey 2024"
    >
      Fast alle Kunden lesen Bewertungen,
      <br />
      bevor sie anrufen.
    </StatementSlide>
  ),
};
