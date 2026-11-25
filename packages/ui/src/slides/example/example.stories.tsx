import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Example } from "./example";
import { ExampleExample } from "./example.example";

const meta = {
  title: "Slides/Example",
  component: Example,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj;

/** On Ink: the label, a user's sentence at 48px, the call it becomes as code on the quiet surface, and the model under it. */
export const Default: Story = {
  render: () => <ExampleExample />,
};

/**
 * Before the output's step: the question stands alone, the call it becomes and the caption keep
 * their places unseen. Shown at step 0 of 1, because at step 1 the slide is whole.
 */
export const StepByStep: Story = {
  decorators: [atStep(0, 1)],
  render: () => (
    <Slide ground="ink" deck="Der digitale Handschlag" page={10}>
      <Title>
        Der Assistent auf der Website
        <br />
        macht aus der Frage eine Suche.
      </Title>
      <Spacer />
      <Example
        outputStep={1}
        input="„Haben Sie am Freitag noch was frei für ein Aufmaß?“"
        output='termine_suchen(tag: "Freitag", art: "Aufmaß")'
        caption="Sprachmodell auf dem eigenen Server, ohne Daten an Dritte"
      />
    </Slide>
  ),
};
