import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";

import { Button } from "@/components/button/button";

import { Progress, ProgressLabel, ProgressTrack, ProgressValue } from "./progress";

const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: { visual: { viewport: { width: 440, height: 130 } } },
  // Untyped args: `value` is required, and every story here renders its own.
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** The name at the start, the value at the end, the trough under both. */
export const Default: Story = {
  render: () => (
    <Progress value={40} locale="de-DE" className="w-[340px]">
      <ProgressLabel>Angebot wird exportiert</ProgressLabel>
      <ProgressValue />
      <ProgressTrack />
    </Progress>
  ),
};

/** Without children it is the bare track; `aria-label` names it. */
export const Bare: Story = {
  parameters: { visual: { viewport: { width: 440, height: 90 } } },
  render: () => (
    <Progress
      value={65}
      locale="de-DE"
      aria-label="Fotos werden hochgeladen"
      className="w-[340px]"
    />
  ),
};

/**
 * `value={null}`: the end is not known yet, so there is no number, and a part of the fill runs
 * through the trough. Under reduced motion the trough is full and breathes (captures show that
 * state, standing still).
 */
export const Indeterminate: Story = {
  render: () => (
    <Progress value={null} className="w-[340px]">
      <ProgressLabel>Verbindung wird hergestellt</ProgressLabel>
      <ProgressTrack />
    </Progress>
  ),
};

/** Done: the trough is full. Say so in words where it matters; the bar alone is not a message. */
export const Complete: Story = {
  render: () => (
    <Progress value={100} locale="de-DE" className="w-[340px]">
      <ProgressLabel>Angebot exportiert</ProgressLabel>
      <ProgressValue />
      <ProgressTrack />
    </Progress>
  ),
};

function Steps() {
  const [step, setStep] = useState(1);
  return (
    <div className="flex w-[340px] flex-col items-start gap-4">
      <Progress value={step} max={4} locale="de-DE" format={{ maximumFractionDigits: 0 }}>
        <ProgressLabel>Einrichtung</ProgressLabel>
        <ProgressValue>{(_, value) => `Schritt ${value ?? 0} von 4`}</ProgressValue>
        <ProgressTrack />
      </Progress>
      <Button onClick={() => setStep((current) => (current === 4 ? 1 : current + 1))}>
        Weiter
      </Button>
    </div>
  );
}

/** The fill follows the value on `glide`: it travels inside the trough and does not overshoot. */
export const Advancing: Story = {
  parameters: {
    visual: {
      viewport: { width: 440, height: 170 },
      motion: [{ name: "advance", click: "button", frames: 8 }],
    },
  },
  render: () => <Steps />,
};

/**
 * What assistive technology gets, as a test: a progress bar named by its label, with its value
 * as a number and as words, and both follow when the task advances.
 */
export const Announced: Story = {
  render: () => <Steps />,
  play: async ({ canvas, userEvent, step }) => {
    const bar = canvas.getByRole("progressbar", { name: "Einrichtung" });

    await step("The bar reports where the task stands", async () => {
      await expect(bar).toHaveAttribute("aria-valuenow", "1");
      await expect(bar).toHaveAttribute("aria-valuemax", "4");
      await expect(canvas.getByText("Schritt 1 von 4")).toBeVisible();
    });

    await step("It follows when the task advances", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Weiter" }));
      await expect(bar).toHaveAttribute("aria-valuenow", "2");
      await expect(canvas.getByText("Schritt 2 von 4")).toBeVisible();
    });
  },
};
