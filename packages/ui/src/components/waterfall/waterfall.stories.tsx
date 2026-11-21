import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";

import { Waterfall, type WaterfallStep } from "./waterfall";

const meta = {
  title: "Components/Waterfall",
  component: Waterfall,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 420 }, target: '[data-slot="waterfall-plot"]' },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const euro = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;

const november: WaterfallStep[] = [
  { name: "Einnahmen", value: 48_200 },
  { name: "Material", value: -14_800 },
  { name: "Fremdleistung", value: -6_300 },
  { name: "Software", value: -1_240 },
  { name: "Ergebnis", value: 0, kind: "total" },
];

const december: WaterfallStep[] = [
  { name: "Einnahmen", value: 39_600 },
  { name: "Material", value: -11_200 },
  { name: "Fremdleistung", value: -9_400 },
  { name: "Software", value: -1_240 },
  { name: "Ergebnis", value: 0, kind: "total" },
];

/** The result of a month, built from its revenue and its costs. */
export const Default: Story = {
  render: () => (
    <Waterfall
      className="w-[42rem] max-w-full"
      label="Ergebnis im November"
      data={november}
      format={euro}
    />
  ),
};

/** Gains in the text colour and losses in the quiet grey; the total in Indigo. */
export const Quiet: Story = {
  render: () => (
    <Waterfall
      className="w-[42rem] max-w-full"
      label="Ergebnis im November"
      colors="quiet"
      tone="accent"
      data={november}
      format={euro}
    />
  ),
};

/** A quarter: every month adds its revenue and its costs, and a total stands after each. */
export const Quarter: Story = {
  parameters: { visual: { viewport: { width: 980, height: 460 } } },
  render: () => (
    <Waterfall
      className="w-[56rem] max-w-full"
      label="Ergebnis im vierten Quartal"
      data={[
        { name: "Einnahmen Okt.", value: 41_000 },
        { name: "Kosten Okt.", value: -22_300 },
        { name: "Oktober", value: 0, kind: "total" },
        { name: "Einnahmen Nov.", value: 48_200 },
        { name: "Kosten Nov.", value: -22_340 },
        { name: "Bis November", value: 0, kind: "total" },
        { name: "Einnahmen Dez.", value: 39_600 },
        { name: "Kosten Dez.", value: -21_840 },
        { name: "Quartal", value: 0, kind: "total" },
      ]}
      format={euro}
    />
  ),
};

/** Costs larger than the revenue: the result hangs below zero, its round end at the bottom. */
export const NegativeResult: Story = {
  name: "Negative result",
  render: () => (
    <Waterfall
      className="w-[42rem] max-w-full"
      label="Ergebnis im Januar"
      data={[
        { name: "Einnahmen", value: 12_400 },
        { name: "Material", value: -9_800 },
        { name: "Fremdleistung", value: -6_200 },
        { name: "Software", value: -1_240 },
        { name: "Ergebnis", value: 0, kind: "total" },
      ]}
      format={euro}
    />
  ),
};

/** On a card; another month moves the cuts of the columns to their new sums. */
export const InACard: Story = {
  name: "In a card",
  parameters: {
    visual: {
      viewport: { width: 820, height: 500 },
      motion: [{ name: "month", click: '[data-step="month"]' }],
    },
  },
  render: function Render() {
    const [month, setMonth] = useState<"november" | "dezember">("november");
    return (
      <Card className="w-[46rem] max-w-full">
        <CardBar>
          <Heading level={2} size="label">
            {month === "november" ? "Ergebnis im November" : "Ergebnis im Dezember"}
          </Heading>
          <Button
            variant="secondary"
            size="sm"
            resize
            data-step="month"
            onClick={() => setMonth(month === "november" ? "dezember" : "november")}
          >
            {month === "november" ? "Dezember zeigen" : "November zeigen"}
          </Button>
        </CardBar>
        <div className="px-5 pt-4 pb-5">
          <Waterfall
            label={month === "november" ? "Ergebnis im November" : "Ergebnis im Dezember"}
            data={month === "november" ? november : december}
            format={euro}
          />
        </div>
      </Card>
    );
  },
};

/** On a phone: long names break under their columns; the figures stay whole. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 460 }, motion: [] } },
  render: () => (
    <Waterfall
      className="w-full"
      label="Ergebnis im November"
      height={200}
      data={november}
      format={euro}
    />
  ),
};

/** The keyboard walks the steps; each is said with its change and the sum after it. */
export const Keyboard: Story = {
  render: () => (
    <Waterfall
      className="w-[42rem] max-w-full"
      label="Ergebnis im November"
      data={november}
      format={euro}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const plot = canvas.getByRole("group", { name: /Ergebnis im November/ });
    const said = () => canvasElement.querySelector('[aria-live="polite"]');

    await step("Tab reaches the plot; the first arrow stands on the first step", async () => {
      await userEvent.tab();
      await expect(plot).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() =>
        expect(said()).toHaveTextContent(
          /^Einnahmen: Veränderung \+48\.200\s€, Stand 48\.200\s€$/u,
        ),
      );
    });

    await step("A loss is said with its minus", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() =>
        expect(said()).toHaveTextContent(/^Material: Veränderung −14\.800\s€, Stand 33\.400\s€$/u),
      );
    });

    await step("End reaches the result, Escape leaves", async () => {
      await userEvent.keyboard("{End}");
      await waitFor(() => expect(said()).toHaveTextContent(/^Ergebnis: Summe 25\.860\s€$/u));
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvasElement.querySelector("[data-shown]")).toBeNull());
    });
  },
};
