import type { Meta, StoryObj } from "@storybook/react-vite";

import { Body } from "@/slides/body/body";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { CoBrand } from "./co-brand";
import { CoBrandExample } from "./co-brand.example";

const meta = {
  title: "Slides/CoBrand",
  component: CoBrand,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof CoBrand>;

export default meta;
type Story = StoryObj<typeof CoBrand>;

/** At 32px on a client's cover: the drawn wordmark, a hairline, the client's name in regular weight. */
export const Default: Story = {
  render: () => <CoBrandExample />,
};

/**
 * At 24px on Paper: both sides are live text, and the hairline is as tall as the type. Without
 * the footer row, which would show the wordmark a second time.
 */
export const Small: Story = {
  render: () => (
    <Slide footer={false}>
      <Title>Ein Vorschlag für die Schreinerei Mustermann.</Title>
      <Spacer />
      <Body>Analyse, Vorschlag und Festpreis stehen auf den nächsten Seiten.</Body>
      <CoBrand partner="Schreinerei Mustermann" size={24} />
    </Slide>
  ),
};
