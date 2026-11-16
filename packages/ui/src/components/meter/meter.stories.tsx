import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Meter, MeterLabel, MeterTrack, MeterValue } from "./meter";

const meta = {
  title: "Components/Meter",
  component: Meter,
  parameters: { visual: { viewport: { width: 440, height: 130 } } },
  // Untyped args: `value` is required, and every story here renders its own.
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** An amount within a range. The fill is the text colour: it measures, it does not ask. */
export const Default: Story = {
  render: () => (
    <Meter value={3} max={5} className="w-[340px]">
      <MeterLabel>Angebote in diesem Monat</MeterLabel>
      <MeterValue>{(_, value) => `${value} von 5`}</MeterValue>
      <MeterTrack />
    </Meter>
  ),
};

/** Without a function, the value is a percentage. */
export const Percentage: Story = {
  render: () => (
    <Meter value={24} locale="de-DE" className="w-[340px]">
      <MeterLabel>Speicher belegt</MeterLabel>
      <MeterValue />
      <MeterTrack />
    </Meter>
  ),
};

/**
 * `tone` colours the fill. The words carry the message ("fast voll", "voll"); the colour only
 * repeats it.
 */
export const Tones: Story = {
  parameters: { visual: { viewport: { width: 440, height: 300 } } },
  render: () => (
    <div className="flex w-[340px] flex-col gap-5">
      <Meter value={1.2} max={5} locale="de-DE">
        <MeterLabel>Speicher</MeterLabel>
        <MeterValue>{() => "1,2 von 5 GB"}</MeterValue>
        <MeterTrack />
      </Meter>
      <Meter value={2.1} max={5} tone="success" locale="de-DE">
        <MeterLabel>Speicher</MeterLabel>
        <MeterValue>{() => "2,1 von 5 GB, genug Platz"}</MeterValue>
        <MeterTrack />
      </Meter>
      <Meter value={4.4} max={5} tone="warning" locale="de-DE">
        <MeterLabel>Speicher</MeterLabel>
        <MeterValue>{() => "4,4 von 5 GB, fast voll"}</MeterValue>
        <MeterTrack />
      </Meter>
      <Meter value={5} max={5} tone="danger" locale="de-DE">
        <MeterLabel>Speicher</MeterLabel>
        <MeterValue>{() => "5 von 5 GB, voll"}</MeterValue>
        <MeterTrack />
      </Meter>
    </div>
  ),
};

/** `tone="accent"`: Indigo, for the one meter a view is about. The default stays the text colour. */
export const Accent: Story = {
  render: () => (
    <Meter value={3} max={5} tone="accent" className="w-[340px]">
      <MeterLabel>Angebote in diesem Monat</MeterLabel>
      <MeterValue>{(_, value) => `${value} von 5`}</MeterValue>
      <MeterTrack />
    </Meter>
  ),
};

/** Without children it is the bare track, for a table cell or a card; `aria-label` names it. */
export const Bare: Story = {
  parameters: { visual: { viewport: { width: 440, height: 90 } } },
  render: () => (
    <Meter value={70} locale="de-DE" aria-label="Speicher belegt" className="w-[340px]" />
  ),
};

/**
 * What assistive technology gets, as a test: a meter named by its label, with the amount as a
 * number within its range.
 */
export const Announced: Story = {
  render: Default.render,
  play: async ({ canvas, step }) => {
    await step("The meter reports the amount and its range", async () => {
      const meter = canvas.getByRole("meter", { name: "Angebote in diesem Monat" });
      await expect(meter).toHaveAttribute("aria-valuenow", "3");
      await expect(meter).toHaveAttribute("aria-valuemin", "0");
      await expect(meter).toHaveAttribute("aria-valuemax", "5");
      await expect(canvas.getByText("3 von 5")).toBeVisible();
    });
  },
};
