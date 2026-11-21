import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";

import { Dumbbell, type DumbbellItem } from "./dumbbell";

const meta = {
  title: "Components/Dumbbell",
  component: Dumbbell,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 380 }, target: '[data-slot="dumbbell-plot"]' },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const euro = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;
const hours = { style: "unit", unit: "hour", unitDisplay: "short" } as const;

const prices: DumbbellItem[] = [
  { name: "Beratung pro Stunde", from: 95, to: 105 },
  { name: "Umsetzung pro Stunde", from: 85, to: 92 },
  { name: "Wartung pro Stunde", from: 75, to: 75 },
  { name: "Schulung pro Stunde", from: 110, to: 118 },
  { name: "Notdienst pro Stunde", from: 140, to: 155 },
];

const projects: DumbbellItem[] = [
  { name: "Website Bäckerei Kornprobst", from: 40, to: 46 },
  { name: "Angebotsportal Gärtnerei Weiß", from: 120, to: 104 },
  { name: "Shop Schreinerei Mustermann", from: 64, to: 71 },
  { name: "Wartung Elektro Wagner", from: 12, to: 9 },
];

/** The prices of 2025 against those of 2026, per service. */
export const Default: Story = {
  render: () => (
    <Dumbbell
      className="w-[42rem] max-w-full"
      label="Stundensätze 2025 und 2026"
      labels={["2025", "2026"]}
      data={prices}
      format={euro}
    />
  ),
};

/** Planned against worked hours; some went down. Sorted: the largest rise first. */
export const PlannedAndActual: Story = {
  name: "Planned and actual",
  render: () => (
    <Dumbbell
      className="w-[42rem] max-w-full"
      label="Geplante und tatsächliche Stunden je Projekt"
      labels={["Geplant", "Tatsächlich"]}
      data={projects}
      format={hours}
      zero
      sort
      tone="accent"
    />
  ),
};

/** A name too long for its column is cut with an ellipsis; the change always stands whole. */
export const LongNames: Story = {
  name: "Long names",
  render: () => (
    <Dumbbell
      className="w-[30rem] max-w-full"
      label="Antwortzeit in Tagen"
      labels={["Oktober", "November"]}
      data={[
        { name: "Auftragsbestätigung herunterladen", from: 3, to: 1.5 },
        { name: "Rückfragen zum Angebot der Backstube", from: 2, to: 2.5 },
        { name: "Rechnung", from: 1, to: 1 },
      ]}
    />
  ),
};

const years: Record<"2026" | "2027", DumbbellItem[]> = {
  "2026": prices,
  "2027": prices.map((item) => ({ ...item, from: item.to, to: Math.round(item.to * 1.06) })),
};

/** On a card; another pair of years moves the dots and their lines to their new places. */
export const InACard: Story = {
  name: "In a card",
  parameters: {
    visual: {
      viewport: { width: 820, height: 440 },
      motion: [{ name: "years", click: '[data-step="years"]' }],
    },
  },
  render: function Render() {
    const [year, setYear] = useState<"2026" | "2027">("2026");
    return (
      <Card className="w-[46rem] max-w-full">
        <CardBar>
          <Heading level={2} size="label">
            Stundensätze
          </Heading>
          <Button
            variant="secondary"
            size="sm"
            resize
            data-step="years"
            onClick={() => setYear(year === "2026" ? "2027" : "2026")}
          >
            {year === "2026" ? "2027 planen" : "2026 zeigen"}
          </Button>
        </CardBar>
        <div className="px-5 pt-4 pb-5">
          <Dumbbell
            label="Stundensätze"
            labels={year === "2026" ? ["2025", "2026"] : ["2026", "2027"]}
            data={years[year]}
            format={euro}
          />
        </div>
      </Card>
    );
  },
};

/** On a phone: the names take what is left beside the track and the change. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 380 }, motion: [] } },
  render: () => (
    <Dumbbell
      className="w-full"
      label="Stundensätze 2025 und 2026"
      labels={["2025", "2026"]}
      data={prices}
      format={euro}
    />
  ),
};

/** The keyboard walks the rows; each is said with both values and the change. */
export const Keyboard: Story = {
  render: () => (
    <Dumbbell
      className="w-[42rem] max-w-full"
      label="Stundensätze 2025 und 2026"
      labels={["2025", "2026"]}
      data={prices}
      format={euro}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const plot = canvas.getByRole("group", { name: /Stundensätze 2025 und 2026/ });
    const said = () => canvasElement.querySelector('[aria-live="polite"]');

    await step("Tab reaches the rows; the first arrow stands on the first", async () => {
      await userEvent.tab();
      await expect(plot).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(() =>
        expect(said()).toHaveTextContent(
          /^Beratung pro Stunde: 2025 95\s€, 2026 105\s€, Veränderung \+11\s%$/u,
        ),
      );
    });

    await step("A price that stayed is said as neither way", async () => {
      await userEvent.keyboard("{ArrowDown}{ArrowDown}");
      await waitFor(() => expect(said()).toHaveTextContent(/Veränderung ±0\s%$/u));
    });

    await step("Escape leaves", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvasElement.querySelector("[data-shown]")).toBeNull());
    });
  },
};
