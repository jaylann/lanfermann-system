import type { Meta, StoryObj } from "@storybook/react-vite";

import { Body } from "@/slides/body/body";
import { Meta as MetaLine } from "@/slides/meta/meta";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { onStage, slideParameters } from "@/slides/story-slide";

import { Lead } from "./lead";
import { LeadExample } from "./lead.example";

const meta = {
  title: "Slides/Lead",
  component: Lead,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Lead>;

export default meta;
type Story = StoryObj<typeof Lead>;

/** Under a title, in the muted text colour. */
export const Default: Story = {
  render: () => <LeadExample />,
};

/** Standing alone, without a title above it: `muted={false}` sets it in the text colour. */
export const Alone: Story = {
  render: () => (
    <Slide deck="Der digitale Handschlag" page={3}>
      <Lead muted={false}>Wer online nichts findet, ruft beim Nächsten an.</Lead>
      <Spacer />
      <Body>
        Bevor jemand anruft, hat er Ihren Namen gesucht, die Bewertungen gelesen und Ihre Seite
        geöffnet.
      </Body>
      <MetaLine>Aus 14 Gesprächen mit Münchner Betrieben, Oktober 2026</MetaLine>
    </Slide>
  ),
};
