import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Objections } from "./objections";
import { ObjectionsExample } from "./objections.example";

const meta = {
  title: "Slides/Objections",
  component: Objections,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Objections>;

export default meta;
type Story = StoryObj;

/** Three objections on Tint: the quote in italics on five columns, its answer upright on seven. */
export const Default: Story = {
  render: () => <ObjectionsExample />,
};

/** At step 1 on Tint: the first objection stands from the start, the second has appeared with its answer and line, the third keeps its place unseen. */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide ground="tint" deck="Der digitale Handschlag" page={8}>
      <Title>Was ich in fast jedem Gespräch höre.</Title>
      <Spacer />
      <Objections
        items={[
          {
            quote: "„Wir leben von Empfehlungen.“",
            answer:
              "Auch wer empfohlen wird, wird gesucht. Die Empfehlung endet auf Ihrer Website.",
          },
          {
            quote: "„Wir haben doch schon eine Seite.“",
            answer: "Die Frage ist, ob sie auf dem Smartphone in drei Sekunden sagt, was Sie tun.",
            step: 1,
          },
          {
            quote: "„Dafür haben wir keine Zeit.“",
            answer: "Ich brauche von Ihnen zwei Stunden: ein Gespräch und eine Freigabe.",
            step: 2,
          },
        ]}
      />
    </Slide>
  ),
};
