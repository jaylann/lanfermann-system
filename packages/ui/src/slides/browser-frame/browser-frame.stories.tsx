import type { Meta, StoryObj } from "@storybook/react-vite";

import { Findings } from "@/slides/findings/findings";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { BrowserFrame } from "./browser-frame";
import { BrowserFrameExample } from "./browser-frame.example";

const meta = {
  title: "Slides/BrowserFrame",
  component: BrowserFrame,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof BrowserFrame>;

export default meta;
type Story = StoryObj;

/** Without a screenshot: the wireframe under the address bar, on seven columns. */
export const Default: Story = {
  render: () => <BrowserFrameExample />,
};

/**
 * On Ink: the frame stays a light page and its markers indigo, while the markers beside the
 * findings follow the slide.
 */
export const OnInk: Story = {
  render: () => (
    <Slide ground="ink" deck="Der digitale Handschlag" page={4}>
      <Title>Zwei Stellen fallen sofort auf.</Title>
      <Spacer />
      <Split ratio="7|5" align="stretch">
        <BrowserFrame
          url="ihr-betrieb.de"
          markers={[
            { n: 1, x: 776, y: 76 },
            { n: 2, x: 448, y: 212 },
          ]}
        />
        <Findings
          items={[
            {
              title: "Die Telefonnummer fehlt im Kopf.",
              text: "Wer mobil sucht, will sofort anrufen.",
            },
            {
              title: "Das Startbild lädt unkomprimiert.",
              text: "Auf dem Smartphone bleibt die Seite lange leer.",
            },
          ]}
        />
      </Split>
      <Source>Analyse vom 11.11.2026, Smartphone und Desktop</Source>
    </Slide>
  ),
};
