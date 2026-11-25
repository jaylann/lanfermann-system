import type { Meta, StoryObj } from "@storybook/react-vite";

import { Findings } from "@/slides/findings/findings";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { PhoneFrame } from "./phone-frame";
import { PhoneFrameExample } from "./phone-frame.example";

const meta = {
  title: "Slides/PhoneFrame",
  component: PhoneFrame,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof PhoneFrame>;

export default meta;
type Story = StoryObj;

/** Without a screenshot: the compact wireframe in the bezel, two markers and their findings. */
export const Default: Story = {
  render: () => <PhoneFrameExample />,
};

/**
 * At step 1: the phone stands from the start, marker 1 and its finding have appeared, marker 2
 * and its finding keep their places unseen.
 */
export const StepByStep: Story = {
  decorators: [atStep(1)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={5}>
      <Title>
        Auf dem Smartphone fehlt
        <br />
        der Weg zum Anruf.
      </Title>
      <Spacer />
      <Split ratio="4|8" align="end">
        <PhoneFrame
          markers={[
            { n: 1, x: 152, y: 12, step: 1 },
            { n: 2, x: 88, y: 152, step: 2 },
          ]}
        />
        <Findings
          items={[
            {
              title: "Keine Telefonnummer im Kopf.",
              text: "Das Menü verbirgt sie hinter zwei Tipps.",
              step: 1,
            },
            {
              title: "Das Startbild füllt den ganzen Bildschirm.",
              text: "Was der Betrieb anbietet, steht erst darunter.",
              step: 2,
            },
          ]}
        />
      </Split>
      <Source>Aufnahme vom 11.11.2026, iPhone, Mobilfunknetz</Source>
    </Slide>
  ),
};
