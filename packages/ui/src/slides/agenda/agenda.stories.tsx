import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { onStage, slideParameters } from "@/slides/story-slide";
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
