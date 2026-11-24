import type { Meta, StoryObj } from "@storybook/react-vite";

import { Findings } from "@/slides/findings/findings";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
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

/**
 * At step 1: the screenshot stands from the start, markers 1 and 2 with their findings have
 * appeared, marker 3 and its finding keep their places unseen.
 */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={4}>
      <Title>Drei Stellen kosten Sie heute Anfragen.</Title>
      <Spacer />
      <Split ratio="7|5" align="stretch">
        <BrowserFrame
          url="ihr-betrieb.de"
          markers={[
            { n: 1, x: 776, y: 76 },
            { n: 2, x: 448, y: 212, step: 1 },
            { n: 3, x: 96, y: 412, step: 2 },
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
              step: 1,
            },
            {
              title: "Kein Weg zur Terminanfrage.",
              text: "Interessenten finden kein Formular und keine Zeiten.",
              step: 2,
            },
          ]}
        />
      </Split>
      <Source>Analyse vom 11.11.2026, Smartphone und Desktop</Source>
    </Slide>
  ),
};
