import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Loop } from "./loop";
import { LoopExample } from "./loop.example";

// A ring of six told clockwise: the inquiry stands from the start, each further step comes with
// the connector into it, what one round is comes last.
function LoopBuiltUp() {
  return (
    <Slide deck="Der digitale Handschlag" page={18}>
      <Title>Jeder zufriedene Kunde bringt den nächsten.</Title>
      <Spacer />
      <Loop
        cols={12}
        nodeSpan={3}
        center={{
          label: "Ein Durchlauf",
          title: "Vom Anruf zur Bewertung.",
          text: "sichtbar im Google-Profil",
          appearsAt: 6,
        }}
        steps={[
          { title: "Anfrage" },
          { title: "Rückruf", appearsAt: 1 },
          { title: "Termin", appearsAt: 2 },
          { title: "Angebot", appearsAt: 3 },
          { title: "Auftrag", appearsAt: 4 },
          { title: "Bewertung", highlight: true, appearsAt: 5 },
        ]}
      />
    </Slide>
  );
}

const meta = {
  title: "Slides/Loop",
  component: Loop,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Loop>;

export default meta;
type Story = StoryObj;

/** Eight steps around a rectangle with one round in the middle, beside two numbered findings. */
export const Default: Story = {
  render: () => <LoopExample />,
};

/** A ring of six at the first of six clicks: the inquiry and the call back, joined. */
export const StepByStep: Story = {
  render: () => <LoopBuiltUp />,
  decorators: [atStep(1, 6)],
};
