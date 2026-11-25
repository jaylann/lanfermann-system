import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { FigureRow } from "./figure-row";
import { FigureRowExample } from "./figure-row.example";

const meta = {
  title: "Slides/FigureRow",
  component: FigureRow,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof FigureRow>;

export default meta;
type Story = StoryObj;

/** Three figures at 108px under 2px rules: unit, label and source each, the first in the accent. */
export const Default: Story = {
  render: () => <FigureRowExample />,
};

/** At step 1: the first figure stands from the start, the second has appeared, the third keeps its place unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={7}>
      <Title>
        Vom Anruf bis zum Angebot
        <br />
        geht unterwegs viel verloren.
      </Title>
      <Spacer />
      <FigureRow
        items={[
          {
            value: "41",
            unit: "%",
            label: "der Anrufe landen außerhalb der Bürozeiten.",
            source: "Eigene Auswertung, 9 Betriebe, Oktober 2026",
          },
          {
            value: "3",
            unit: "Tage",
            label: "dauert ein Rückruf im Mittel, wenn niemand abnimmt.",
            source: "Eigene Auswertung, 9 Betriebe, Oktober 2026",
            step: 1,
          },
          {
            value: "1",
            unit: "von 4",
            label: "Anfragen wird am Ende zu einem Angebot.",
            source: "Eigene Auswertung, 9 Betriebe, Oktober 2026",
            highlight: true,
            step: 2,
          },
        ]}
      />
    </Slide>
  ),
};
