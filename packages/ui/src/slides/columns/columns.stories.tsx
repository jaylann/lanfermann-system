import type { Meta, StoryObj } from "@storybook/react-vite";

import { ICONS } from "@/slides/icon/icons";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Columns } from "./columns";
import { ColumnsExample } from "./columns.example";

const meta = {
  title: "Slides/Columns",
  component: Columns,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Columns>;

export default meta;
type Story = StoryObj;

/** Three services as columns under rules: a 40px icon before each 48px title, the text at 32px. */
export const Default: Story = {
  render: () => <ColumnsExample />,
};

/** At step 1: the first service stands from the start, the second has appeared with its rule, the third keeps its place unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={6} forms="corner">
      <Title>Drei Dinge, die ich für Betriebe übernehme.</Title>
      <Spacer />
      <Columns
        items={[
          {
            icon: ICONS.browser,
            title: "Website",
            text: "Eine schnelle, klare Seite, die Anfragen bringt und auf dem Smartphone funktioniert.",
          },
          {
            icon: ICONS.search,
            title: "Sichtbarkeit",
            text: "Google-Profil, Bewertungen und lokale Suche, damit man Sie in Ihrem Viertel findet.",
            step: 1,
          },
          {
            icon: ICONS.cycle,
            title: "Automatisierung",
            text: "Terminanfragen, Angebote und Rückrufe, die ohne Zettelwirtschaft laufen.",
            step: 2,
          },
        ]}
      />
    </Slide>
  ),
};
