import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spacer } from "@/slides/spacer/spacer";
import { onStage, slideParameters, toolbarGround } from "@/slides/story-slide";

import { Slide } from "./slide";

const meta = {
  title: "Slides/Slide",
  component: Slide,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Slide>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The Stack frame: the title on the top margin, the evidence and its source on the bottom one,
 * the footer row under it. The ground follows the toolbar.
 */
export const Stack: Story = {
  render: (args, { globals }) => (
    <Slide {...args} ground={args.ground ?? toolbarGround(globals)}>
      <h2 className="slide-span-10 text-slide-title font-medium text-fg">
        Der Titel ist ein ganzer Satz
        <br />
        und nennt das Ergebnis.
      </h2>
      <Spacer />
      <p className="slide-span-6">
        Der Beleg steht unten auf dem Rand: eine Zahl, eine Tabelle, ein Screenshot. Dazwischen
        bleibt Luft.
      </p>
      <p className="text-slide-meta text-fg-muted">Quelle oder Methode, in einem Satz</p>
    </Slide>
  ),
  args: { deck: "Der digitale Handschlag", page: 2 },
};

/** The claim on Ink: one sentence at 108px, top left, and nothing else. */
export const Statement: Story = {
  render: (args) => (
    <Slide {...args}>
      <h2 className="slide-span-12 text-slide-statement font-medium text-fg">
        Vertrauen entsteht,
        <br />
        bevor das Telefon klingelt.
      </h2>
      <Spacer />
    </Slide>
  ),
  args: { ground: "ink", deck: "Der digitale Handschlag", page: 4 },
};

/** Without the footer row and with the wider gap, as a cover and a closing slide stand. */
export const WithoutFooter: Story = {
  render: (args) => (
    <Slide {...args}>
      <Spacer />
      <h1 className="slide-span-10 text-slide-cover font-medium text-fg">
        Kostenlose
        <br />
        Analyse.
      </h1>
      <p className="slide-span-10 text-slide-lead text-fg-muted">
        Ich sehe mir Ihre Website an und schreibe Ihnen, was heute Anfragen kostet.
      </p>
    </Slide>
  ),
  args: { ground: "indigo", footer: false, gap: 48 },
};
