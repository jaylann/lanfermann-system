import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { KeyValue } from "./key-value";
import { KeyValueExample } from "./key-value.example";

const meta = {
  title: "Slides/KeyValue",
  component: KeyValue,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof KeyValue>;

export default meta;
type Story = StoryObj;

/** The scope of an offer: terms on four columns, their descriptions on eight. */
export const Default: Story = {
  render: () => <KeyValueExample />,
};

/** At step 1: the first row stands from the start under the rule, the second has appeared with its line, the last two keep their places unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={7}>
      <Title>Was Sie für die Analyse bekommen.</Title>
      <Spacer />
      <KeyValue
        items={[
          [
            "Bestandsaufnahme",
            "Ich prüfe Ihre Website auf dem Smartphone und am Rechner, so wie ein Kunde sie sieht.",
          ],
          [
            "Vergleich",
            "Drei Betriebe aus Ihrer Nähe und Ihrer Branche, Seite an Seite mit Ihrer.",
            1,
          ],
          ["Befund", "Die Stellen, an denen Ihnen Anfragen entgehen, mit Screenshot und Beleg.", 2],
          [
            "Gespräch",
            "20 Minuten, in denen ich Ihnen zeige, was sich ändern lässt und was es kostet.",
            3,
          ],
        ]}
      />
    </Slide>
  ),
};
