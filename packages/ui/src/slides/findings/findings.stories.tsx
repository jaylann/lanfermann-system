import type { Meta, StoryObj } from "@storybook/react-vite";

import { BrowserFrame } from "@/slides/browser-frame/browser-frame";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Findings } from "./findings";
import { FindingsExample } from "./findings.example";

const meta = {
  title: "Slides/Findings",
  component: Findings,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Findings>;

export default meta;
type Story = StoryObj;

/** Three numbered findings on five columns, each with the line that says why it matters. */
export const Default: Story = {
  render: () => <FindingsExample />,
};

/** At step 1: the first finding stands from the start, the second has appeared with its line and its marker on the screenshot, the third and its marker keep their places unseen. */
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
