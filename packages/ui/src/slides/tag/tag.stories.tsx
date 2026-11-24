import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Tag, Tags } from "./tag";
import { TagExample, TagsExample } from "./tag.example";

const meta = {
  title: "Slides/Tag",
  component: Tag,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof Tag>;

/** `Tag`: eight trades in a row, each a word in a hairline box with no fill. */
export const Default: Story = {
  render: () => <TagExample />,
};

/** `Tags`: the same boxes as one row with a muted label in front. */
export const Labelled: Story = {
  render: () => <TagsExample />,
};

/** `Tags` at step 1: the label and three tags stand, the fourth has appeared, the last two keep their places unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={11}>
      <Title>
        Was ein Kunde vor dem Anruf
        <br />
        über Sie wissen will.
      </Title>
      <Spacer />
      <Tags
        label="Gesucht wird nach"
        items={[
          "Öffnungszeiten",
          "Telefonnummer",
          "Anfahrt",
          { label: "Bewertungen", step: 1 },
          { label: "Preisrahmen", step: 2 },
          { label: "Referenzen", step: 3 },
        ]}
      />
    </Slide>
  ),
};
