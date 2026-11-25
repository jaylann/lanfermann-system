import type { Meta, StoryObj } from "@storybook/react-vite";

import { Lead } from "@/slides/lead/lead";
import { span } from "@/slides/lib/grid";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Source } from "./source";
import { SourceExample } from "./source.example";

const meta = {
  title: "Slides/Source",
  component: Source,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Source>;

export default meta;
type Story = StoryObj<typeof Source>;

/** A source: publisher, title and year, in 24px muted text under the evidence. */
export const Default: Story = {
  render: () => <SourceExample />,
};

/** With the 1px line and a measure: nothing ruled stands above it, so the line ties it to the claim. */
export const WithLine: Story = {
  render: () => (
    <Slide deck="Der digitale Handschlag" page={3}>
      <Title>Eine mobile Seite hat drei Sekunden.</Title>
      <Spacer />
      <Lead muted={false} width={span(7)}>
        53&#8239;% verlassen eine mobile Seite, die länger als drei Sekunden lädt.
      </Lead>
      <Source line width={span(7)}>
        Quelle: Google, The need for mobile speed 2016
      </Source>
    </Slide>
  ),
};
