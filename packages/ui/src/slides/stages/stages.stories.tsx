import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Stages } from "./stages";
import { StagesExample } from "./stages.example";

// Four stages told one by one: the first stands from the start, each other one comes with the
// connector and the checkpoint before it, the path back with the stage it leaves.
function StagesBuiltUp() {
  return (
    <Slide deck="Der digitale Handschlag" page={9}>
      <Title>Vom ersten Anruf bis zum Auftrag.</Title>
      <Spacer />
      <Stages
        gates={[true, true, true]}
        returns={[{ from: 3, to: 2, label: "Rückfrage zum Angebot" }]}
        gateNote="Der Kunde sagt ja"
        returnNote="zurück, wenn etwas offen ist"
        items={[
          { label: "Tag 1", title: "Anfrage", text: "über die Website oder das Google-Profil" },
          { label: "Tag 1", title: "Rückruf", text: "noch am selben Tag", step: 1 },
          { label: "Tag 3", title: "Angebot", text: "schriftlich, mit Festpreis", step: 2 },
          {
            label: "Tag 7",
            title: "Auftrag",
            text: "unterschrieben zurück",
            highlight: true,
            step: 3,
          },
        ]}
      />
    </Slide>
  );
}

const meta = {
  title: "Slides/Stages",
  component: Stages,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Stages>;

export default meta;
type Story = StoryObj;

/** Four stages with three checkpoints, one return path under the row and the legend for both. */
export const Default: Story = {
  render: () => <StagesExample />,
};

/** Four stages at the first of three steps: the inquiry and the call back, with the checkpoint between them. */
export const StepByStep: Story = {
  render: () => <StagesBuiltUp />,
  decorators: [atStep(1, 3)],
};
