import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { atStep, onStage, slideParameters } from "@/slides/story-slide";
import { Title } from "@/slides/title/title";

import { Code } from "./code";
import { CodeExample } from "./code.example";

const meta = {
  title: "Slides/Code",
  component: Code,
  decorators: [onStage],
  parameters: slideParameters,
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj;

/** Six lines of JSON on the quiet surface, indentation kept, the second line in the accent, a caption under the block. */
export const Default: Story = {
  render: () => <CodeExample />,
};

/**
 * Three calls that appear one after the other, shown at step 2: the brackets stand from the
 * start, the first two calls have appeared, the third keeps its place unseen. The line in the
 * accent belongs to the second call.
 */
export const StepByStep: Story = {
  decorators: [atStep(2)],
  render: () => (
    <Slide deck="Der digitale Handschlag" page={13}>
      <Title>
        Aus einer Anfrage
        <br />
        werden drei Schritte.
      </Title>
      <Spacer />
      <Code
        highlight={3}
        reveal={[
          { from: 2, to: 3, step: 1 },
          { from: 4, to: 6, step: 2 },
          { from: 7, to: 8, step: 3 },
        ]}
        caption="Antwort des Assistenten auf „Können Sie nächste Woche zum Aufmaß kommen?“"
        code={[
          "[",
          '  {"werkzeug": "termine_suchen",',
          '   "zeitraum": "nächste Woche"},',
          '  {"werkzeug": "termin_anlegen",',
          '   "beginn": "2026-12-02 09:00",',
          '   "kunde": "Familie Berger"},',
          '  {"werkzeug": "nachricht_senden",',
          '   "text": "Aufmaß am Mittwoch um 9 Uhr"}',
          "]",
        ].join("\n")}
      />
    </Slide>
  ),
};
