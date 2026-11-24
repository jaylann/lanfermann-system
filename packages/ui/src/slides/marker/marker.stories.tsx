import type { Meta, StoryObj } from "@storybook/react-vite";

import { Body } from "@/slides/body/body";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Marker } from "./marker";
import { MarkerExample } from "./marker.example";

const meta = {
  title: "Slides/Marker",
  component: Marker,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Marker>;

export default meta;
type Story = StoryObj<typeof Marker>;

/** On Paper: the numbers on the evidence repeat beside the findings, white on the accent. */
export const Default: Story = {
  render: () => <MarkerExample />,
};

/**
 * On Ink with a light frame: the markers on the frame take `ground="paper"` and stay indigo, the
 * ones beside the findings follow the slide and turn lavender with a dark numeral.
 */
export const OnAFrame: Story = {
  render: () => (
    <Slide ground="ink" deck="Der digitale Handschlag" page={8}>
      <Title>Zwei Stellen fallen am Smartphone sofort auf.</Title>
      <Spacer />
      <Split ratio="7|5">
        <div
          data-slide-ground="paper"
          className="relative flex h-[520px] flex-col gap-6 rounded-[4px] border border-line bg-surface p-8"
        >
          <div className="h-8 w-48 rounded-[2px] bg-surface-quiet" />
          <div className="min-h-0 flex-1 rounded-[2px] bg-surface-quiet" />
          <div className="h-4 w-96 rounded-[2px] bg-surface-quiet" />
          <Marker n={1} ground="paper" style={{ position: "absolute", left: 824, top: 24 }} />
          <Marker n={2} ground="paper" style={{ position: "absolute", left: 448, top: 243 }} />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-6">
            <Marker n={1} />
            <Body width={512}>Die Telefonnummer fehlt im Kopf.</Body>
          </div>
          <div className="flex items-start gap-6">
            <Marker n={2} />
            <Body width={512}>Das Startbild lädt unkomprimiert.</Body>
          </div>
        </div>
      </Split>
      <Source>Analyse vom 11.11.2026, Smartphone und Desktop</Source>
    </Slide>
  ),
};
