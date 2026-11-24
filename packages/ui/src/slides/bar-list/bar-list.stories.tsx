import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { BarList } from "./bar-list";
import { BarListExample } from "./bar-list.example";

const meta = {
  title: "Slides/BarList",
  component: BarList,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof BarList>;

export default meta;
type Story = StoryObj;

/** Three ranked bars across twelve columns: the labels on four, the values at the end, one bar in the accent. */
export const Default: Story = {
  render: () => <BarListExample />,
};

/** At step 1: four rows stand, the top row in the accent, which the talk builds up to, keeps its place unseen; the rule above stays. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={8}>
      <Title>
        Die meisten Anfragen
        <br />
        kommen über Google.
      </Title>
      <Spacer />
      <BarList
        items={[
          // A narrow no-break space before the unit, as German sets it.
          { label: "Google-Profil", value: 46, display: "46 %", highlight: true, step: 2 },
          { label: "Website", value: 24, display: "24 %", step: 1 },
          { label: "Empfehlung", value: 18, display: "18 %" },
          { label: "Telefonbuch", value: 7, display: "7 %" },
          { label: "Sonstige", value: 5, display: "5 %" },
        ]}
      />
      <Source>
        Erster Kontakt neuer Kunden nach eigener Angabe, 9 Handwerksbetriebe, Oktober 2026
      </Source>
    </Slide>
  ),
};
