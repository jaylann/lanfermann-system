import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Steps } from "./steps";
import { StepsExample } from "./steps.example";

const meta = {
  title: "Slides/Steps",
  component: Steps,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj;

/** Four steps in the small setting: the week as the label, a 32px strong title, the text at 24px. */
export const Default: Story = {
  render: () => <StepsExample />,
};

/** At click 1: the first week stands from the start, the second has appeared with its rule, weeks three and four keep their places unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={7}>
      <Title>
        In vier Wochen von der Analyse
        <br />
        zur neuen Seite.
      </Title>
      <Spacer />
      <Steps
        items={[
          { when: "Woche 1", title: "Analyse", text: "Ich prüfe Ihre Seite und drei Mitbewerber." },
          {
            when: "Woche 2",
            title: "Entwurf",
            text: "Sie sehen die Startseite mit Ihren Texten und Fotos.",
            step: 1,
          },
          {
            when: "Woche 3",
            title: "Umsetzung",
            text: "Alle Seiten entstehen, Sie geben frei.",
            step: 2,
          },
          {
            when: "Woche 4",
            title: "Start",
            text: "Die Seite geht live, das Google-Profil zieht mit.",
            step: 3,
          },
        ]}
      />
    </Slide>
  ),
};
