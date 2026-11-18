import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";

import { Button } from "@/components/button/button";

import { Step, Steps, type StepsProps, type StepStatus } from "./steps";

const meta = {
  title: "Components/Steps",
  component: Steps,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 720, height: 150 } },
  },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

const SETUP = [
  { title: "Konto", description: "Name und E-Mail-Adresse" },
  { title: "Tarif", description: "Solo, Team oder Betrieb" },
  { title: "Team", description: "Wer mitarbeitet" },
  { title: "Logo", description: "Für Angebote und Rechnungen" },
];

const statusAt = (index: number, current: number): StepStatus =>
  index < current ? "done" : index === current ? "current" : "upcoming";

type Options = Pick<StepsProps, "orientation" | "marks"> & {
  current?: number;
  descriptions?: boolean;
  links?: boolean;
};

function Setup({ current = 1, descriptions = false, links = false, ...props }: Options) {
  return (
    <Steps aria-label="Einrichtung" {...props}>
      {SETUP.map((step, index) => (
        <Step
          key={step.title}
          status={statusAt(index, current)}
          title={step.title}
          description={descriptions ? step.description : undefined}
          href={links && index < current ? `#${step.title.toLowerCase()}` : undefined}
        />
      ))}
    </Steps>
  );
}

/** Four steps, the second being worked on: disc, heavier ring, rings; the line behind is filled. */
export const Default: Story = {
  render: () => <Setup />,
};

/** `marks="numbers"`: each step's number in its ring, and a tick once it is done. */
export const Numbers: Story = {
  render: () => <Setup marks="numbers" current={2} />,
};

/** With a second line under each name. */
export const WithDescriptions: Story = {
  parameters: { visual: { viewport: { width: 860, height: 170 } } },
  render: () => <Setup descriptions current={2} />,
};

/** A finished step can be opened again: its name is a link back. Steps ahead are not links. */
export const WithLinks: Story = {
  render: () => <Setup links current={2} />,
};

/** One under the other, for a column beside a form. The line then fills downwards. */
export const Vertical: Story = {
  parameters: { visual: { viewport: { width: 420, height: 330 } } },
  render: () => (
    <div className="flex gap-12">
      <Setup orientation="vertical" descriptions current={2} />
      <Setup orientation="vertical" marks="numbers" descriptions current={2} />
    </div>
  ),
};

/**
 * Press "Weiter": the mark of the step that is left closes into the disc, the line behind it
 * fills from its start, and the next mark takes the accent.
 */
export const Next: Story = {
  parameters: {
    visual: {
      viewport: { width: 720, height: 220 },
      target: '[data-slot="button"]',
      motion: [{ name: "next", click: '[data-slot="button"]:last-of-type', frames: 8 }],
    },
  },
  render: function Render() {
    const [current, setCurrent] = useState(1);
    return (
      <div className="flex flex-col gap-8">
        <Setup current={current} />
        <Setup current={current} marks="numbers" />
        <div className="flex gap-2">
          <Button variant="quiet" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
            Zurück
          </Button>
          <Button disabled={current === SETUP.length} onClick={() => setCurrent(current + 1)}>
            Weiter
          </Button>
        </div>
      </div>
    );
  },
};

/** Too narrow for every name: the marks keep their row, and only the current step is named. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 200 } } },
  render: () => (
    <div className="flex flex-col gap-6">
      <Setup current={2} />
      <Setup current={2} marks="numbers" />
    </div>
  ),
};

/**
 * As a test: the list says where one stands, every state is said in words, and a finished step
 * is a link the keyboard reaches.
 */
export const Keyboard: Story = {
  render: () => <Setup links current={2} />,
  play: async ({ canvas, userEvent, step }) => {
    const steps = canvas.getAllByRole("listitem");

    await step("exactly one step is the current one, and each state is said", async () => {
      await expect(steps).toHaveLength(4);
      await expect(steps[2]).toHaveAttribute("aria-current", "step");
      await expect(steps[0]).not.toHaveAttribute("aria-current");
      await expect(steps[0]).toHaveTextContent("Erledigt: Konto");
      await expect(steps[3]).toHaveTextContent("Steht aus: Logo");
    });

    await step("Tab goes through the finished steps, which are links", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Erledigt: Konto" })).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Erledigt: Tarif" })).toHaveFocus();
      await expect(canvas.getAllByRole("link")).toHaveLength(2);
    });
  },
};
