import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";

import { Stage } from "./stage";

const meta = {
  title: "Slides/Stage",
  component: Stage,
  parameters: {
    visual: { viewport: { width: 760, height: 460 }, grounds: ["paper"] },
  },
} satisfies Meta<typeof Stage>;

export default meta;
type Story = StoryObj<typeof meta>;

const slide = (
  <Slide ground="ink" deck="Der digitale Handschlag" page={4}>
    <h2 className="slide-span-12 text-slide-statement font-medium text-fg">
      Vertrauen entsteht,
      <br />
      bevor das Telefon klingelt.
    </h2>
    <Spacer />
  </Slide>
);

/** A slide in a box a third as wide as its canvas: scaled as a whole, type and margins with it. */
export const Default: Story = {
  render: () => (
    <div className="w-[640px]">
      <Stage>{slide}</Stage>
    </div>
  ),
};

/** In a box that is not 16:9 the slide is centred and the rest of the box stays free. */
export const Letterboxed: Story = {
  render: () => <Stage className="aspect-auto h-[400px] w-[520px] bg-surface-quiet">{slide}</Stage>,
};
