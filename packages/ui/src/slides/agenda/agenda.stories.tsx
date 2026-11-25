import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Agenda } from "./agenda";
import { AgendaExample } from "./agenda.example";

const meta = {
  title: "Slides/Agenda",
  component: Agenda,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Agenda>;

export default meta;
type Story = StoryObj;

/** The agenda at the start of a deck: every part with a filled disc and its page. */
export const Default: Story = {
  render: () => <AgendaExample />,
};

/** The agenda again before part 2: the current part in the text colour, the coming ones as open rings. */
export const BeforePartTwo: Story = {
  render: () => (
    <Slide deck="Der digitale Handschlag" page={7}>
      <Title>Wo wir gerade sind.</Title>
      <Spacer />
      <Agenda
        current={1}
        items={[
          ["Wie Kunden heute einen Betrieb auswählen", 3],
          ["Was Ihre Website dabei über Sie sagt", 7],
          ["Drei Stellen, an denen Anfragen verloren gehen", 11],
          ["Was eine neue Seite kostet und bringt", 15],
        ]}
      />
    </Slide>
  ),
};

/** At step 1: the first part stands from the start under the rule, the second has appeared with its line, the last two keep their places unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={2}>
      <Title>Worum es heute geht.</Title>
      <Spacer />
      <Agenda
        items={[
          ["Wie Kunden heute einen Betrieb auswählen", 3],
          ["Was Ihre Website dabei über Sie sagt", 7, 1],
          ["Drei Stellen, an denen Anfragen verloren gehen", 11, 2],
          ["Was eine neue Seite kostet und bringt", 15, 3],
        ]}
      />
    </Slide>
  ),
};
