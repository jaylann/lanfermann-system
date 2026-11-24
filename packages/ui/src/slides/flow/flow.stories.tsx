import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Flow } from "./flow";
import { FlowExample } from "./flow.example";

// A row told left to right: the inquiry stands from the start, each box comes with its arrow.
function FlowBuiltUp() {
  return (
    <Slide deck="Der digitale Handschlag" page={10}>
      <Title>Drei Schritte bis zum Angebot.</Title>
      <Spacer />
      <Flow
        nodes={[
          { title: "Anfrage", text: "über das Formular" },
          { title: "Rückruf", text: "noch am selben Tag", step: 1 },
          { title: "Termin", text: "vor Ort, eine Stunde", step: 2 },
          { title: "Angebot", text: "mit Festpreis", highlight: true, step: 3 },
        ]}
      />
      <Source>Ablauf in einem Malerbetrieb mit drei Mitarbeitern, Oktober 2026</Source>
    </Slide>
  );
}

const meta = {
  title: "Slides/Flow",
  component: Flow,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Flow>;

export default meta;
type Story = StoryObj;

/** Four boxes joined by arrows, the third with the accent edge. */
export const Default: Story = {
  render: () => <FlowExample />,
};

/** Four boxes at the first of three steps: the inquiry and the call back, the arrow between them. */
export const StepByStep: Story = {
  render: () => <FlowBuiltUp />,
  decorators: [atStep(1, 3)],
};
