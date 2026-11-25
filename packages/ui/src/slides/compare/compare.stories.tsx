import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Compare } from "./compare";
import { CompareExample } from "./compare.example";

const meta = {
  title: "Slides/Compare",
  component: Compare,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Compare>;

export default meta;
type Story = StoryObj;

/** Today beside the proposal: the left column muted, the right in the text colour, lines open at the gutter. */
export const Default: Story = {
  render: () => <CompareExample />,
};

/** At step 1: the heads and the first row stand from the start, the second row has appeared with its line, the third keeps its place unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={9}>
      <Title>Was sich für Ihre Kunden ändert.</Title>
      <Spacer />
      <Compare
        left="Heute"
        right="Mit der neuen Seite"
        rows={[
          ["Die Telefonnummer steht im Impressum.", "Ein Tipp auf die Nummer startet den Anruf."],
          ["Die Startseite lädt in sieben Sekunden.", "Sie lädt in unter zwei.", 1],
          [
            "Anfragen kommen nur zu den Öffnungszeiten.",
            "Das Formular nimmt sie rund um die Uhr an.",
            2,
          ],
        ]}
      />
    </Slide>
  ),
};
