import type { Meta, StoryObj } from "@storybook/react-vite";

import { ICONS } from "@/slides/icon/icons";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Diagram } from "./diagram";
import { DiagramExample } from "./diagram.example";

// A diagram told in four steps: where the inquiries come from, the inquiry, the call back, the
// appointment with the shortcut to it.
function DiagramBuiltUp() {
  return (
    <Slide deck="Der digitale Handschlag" page={11}>
      <Title>Aus einer Anfrage wird ein Termin.</Title>
      <Spacer />
      <Diagram
        alt="Website und Google-Profil führen zur Anfrage, die Anfrage über den Rückruf zum Termin"
        nodes={[
          {
            id: "website",
            col: 1,
            row: 1,
            icon: ICONS.browser,
            title: "Website",
            text: "Formular auf jeder Seite",
            step: 1,
          },
          {
            id: "profil",
            col: 1,
            row: 2,
            icon: ICONS.pin,
            title: "Google-Profil",
            text: "Anruf und Route",
            step: 1,
          },
          {
            id: "anfrage",
            col: 5,
            row: 1,
            span: 4,
            rows: 2,
            tone: "accent",
            icon: ICONS.mail,
            title: "Anfrage",
            text: "landet in einem Postfach",
            step: 2,
          },
          {
            id: "rueckruf",
            col: 10,
            row: 1,
            icon: ICONS.call,
            title: "Rückruf",
            text: "am selben Tag",
            step: 3,
          },
          {
            id: "termin",
            col: 10,
            row: 2,
            icon: ICONS.calendar,
            title: "Termin",
            text: "vor Ort beim Kunden",
            step: 4,
          },
        ]}
        edges={[
          { from: "website", to: "anfrage" },
          { from: "profil", to: "anfrage" },
          { from: "anfrage", to: "rueckruf", accent: true },
          { from: "rueckruf", to: "termin" },
          { from: "anfrage", to: "termin", dashed: true, label: "direkt gebucht" },
        ]}
      />
      <Source>Ablauf in einem Malerbetrieb mit drei Mitarbeitern, Oktober 2026</Source>
    </Slide>
  );
}

const meta = {
  title: "Slides/Diagram",
  component: Diagram,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Diagram>;

export default meta;
type Story = StoryObj;

/** An architecture in three columns under column heads, with one accent box and one dashed path. */
export const Default: Story = {
  render: () => <DiagramExample />,
};

/** A diagram of four steps at its first: the two sources, the rest not yet in sight. */
export const StepByStep: Story = {
  render: () => <DiagramBuiltUp />,
  decorators: [atStep(1, 4)],
};

/** The same diagram one step before its last: the call back is there, the appointment not yet. */
export const StepByStepBeforeLast: Story = {
  render: () => <DiagramBuiltUp />,
  decorators: [atStep(3, 4)],
};
