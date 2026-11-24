import type { Meta, StoryObj } from "@storybook/react-vite";

import { onStage, slideParameters } from "@/slides/story-slide";

import { ClosingSlide } from "./closing-slide";
import { ClosingSlideExample } from "./closing-slide.example";

const meta = {
  title: "Slides/ClosingSlide",
  component: ClosingSlide,
  decorators: [onStage],
  parameters: slideParameters,
  args: { title: "Eine kostenlose Analyse." },
} satisfies Meta<typeof ClosingSlide>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The ask on Indigo with the `set` forms and three contact routes. */
export const Default: Story = {
  render: () => <ClosingSlideExample />,
};

/** With the `drop` forms and two routes without icons. */
export const Drop: Story = {
  render: () => (
    <ClosingSlide
      forms="drop"
      title={
        <>
          20 Minuten,
          <br />
          ein Befund.
        </>
      }
      lead={
        <>
          Ich zeige Ihnen am Bildschirm, wo Ihnen Anfragen entgehen.
          <br />
          Danach entscheiden Sie.
        </>
      }
      contacts={[
        ["E-Mail", "justin@lanfermann.dev"],
        ["Web", "lanfermann.dev"],
      ]}
    />
  ),
};
