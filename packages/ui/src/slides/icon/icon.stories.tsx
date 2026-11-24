import type { Meta, StoryObj } from "@storybook/react-vite";

import { Meta as MetaLine } from "@/slides/meta/meta";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Icon } from "./icon";
import { IconExample } from "./icon.example";
import { ICONS, MARKS } from "./icons";

const meta = {
  title: "Slides/Icon",
  component: Icon,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof Icon>;

/** The whole set at 48px, as the kit shows it: 46 pictograms in the accent, then the seven marks. */
export const Default: Story = {
  render: () => <IconExample />,
};

/** Every pictogram of `ICONS` with the German name a screen reader says for it. */
export const Pictograms: Story = {
  render: () => (
    <Slide deck="Der digitale Handschlag" page={5}>
      <Title>46 Piktogramme in einer Strichstärke.</Title>
      <Spacer />
      <div className="grid grid-cols-8 gap-8">
        {Object.values(ICONS).map((icon) => (
          <div key={icon.name} className="flex flex-col gap-2">
            <Icon icon={icon} size={40} />
            <MetaLine>{icon.name}</MetaLine>
          </div>
        ))}
      </div>
    </Slide>
  ),
};

/** The seven product marks of `MARKS`, each in its product's own colour; `mcp` has none. */
export const Marks: Story = {
  render: () => (
    <Slide deck="Der digitale Handschlag" page={5}>
      <Title>Sieben Marken in ihrer eigenen Farbe.</Title>
      <Spacer />
      <div className="grid grid-cols-4 gap-8">
        {Object.values(MARKS).map((icon) => (
          <div key={icon.name} className="flex flex-col gap-2">
            <Icon icon={icon} size={40} />
            <MetaLine>{icon.name}</MetaLine>
          </div>
        ))}
      </div>
      <MetaLine>Marken: Simple Icons. Sie stehen nur für das Produkt, das sie nennen.</MetaLine>
    </Slide>
  ),
};
