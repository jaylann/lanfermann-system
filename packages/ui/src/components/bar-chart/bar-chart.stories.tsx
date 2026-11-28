import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";
import { SegmentedBar } from "@/components/segmented-bar/segmented-bar";
import { Sparkline } from "@/components/sparkline/sparkline";
import {
  costServices,
  revenueMonths,
  serviceCostDays,
} from "@/components/time-series-chart/story-data";
import { seriesPaint } from "@/internal/chart/series-color";
import { toTime } from "@/internal/chart/time";

import { BarChart } from "./bar-chart";

const meta = {
  title: "Components/BarChart",
  component: BarChart,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 420 }, target: '[data-slot="bar-chart-plot"]' },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const euro = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;
const month = new Intl.DateTimeFormat("de-DE", { month: "short" });
const months = revenueMonths();
const monthName = (row: { monat: string }) => month.format(toTime(row.monat));

/** Revenue per month, one column each, in the text colour. */
export const Default: Story = {
  render: () => (
    <BarChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Monat"
      data={months}
      x="monat"
      categoryLabel={monthName}
      series={[{ key: "umsatz", label: "Umsatz" }]}
      format={euro}
    />
  ),
};

const quotes = [
  { monat: "2026-06-01", erstellt: 18, angenommen: 11 },
  { monat: "2026-07-01", erstellt: 22, angenommen: 13 },
  { monat: "2026-08-01", erstellt: 15, angenommen: 9 },
  { monat: "2026-09-01", erstellt: 27, angenommen: 17 },
  { monat: "2026-10-01", erstellt: 31, angenommen: 21 },
  { monat: "2026-11-01", erstellt: 24, angenommen: 16 },
];

/** Two series side by side: quotes written and quotes accepted. */
export const Grouped: Story = {
  render: () => (
    <BarChart
      className="w-[42rem] max-w-full"
      label="Angebote pro Monat"
      data={quotes}
      x="monat"
      categoryLabel={monthName}
      series={[
        { key: "erstellt", label: "Erstellt" },
        { key: "angenommen", label: "Angenommen" },
      ]}
    />
  ),
};

const services = [
  { quartal: "Q1", beratung: 12_400, umsetzung: 38_200, wartung: 6_100 },
  { quartal: "Q2", beratung: 15_800, umsetzung: 42_900, wartung: 6_400 },
  { quartal: "Q3", beratung: 9_700, umsetzung: 51_300, wartung: 7_200 },
  { quartal: "Q4", beratung: 14_100, umsetzung: 47_600, wartung: 7_900 },
];

/** Parts of a whole on each other, divided by a gap of the ground; the readout adds the sum. */
export const Stacked: Story = {
  render: () => (
    <BarChart
      className="w-[42rem] max-w-full"
      label="Umsatz nach Leistung pro Quartal"
      layout="stacked"
      data={services}
      x="quartal"
      series={[
        { key: "umsetzung", label: "Umsetzung" },
        { key: "beratung", label: "Beratung" },
        { key: "wartung", label: "Wartung" },
      ]}
      format={euro}
    />
  ),
};

const result = [
  { monat: "2026-06-01", ergebnis: 4_200 },
  { monat: "2026-07-01", ergebnis: 2_900 },
  { monat: "2026-08-01", ergebnis: -1_400 },
  { monat: "2026-09-01", ergebnis: 3_800 },
  { monat: "2026-10-01", ergebnis: -600 },
  { monat: "2026-11-01", ergebnis: 5_100 },
];

/** Losses hang below zero, their round end at the bottom. */
export const NegativeValues: Story = {
  name: "Negative values",
  render: () => (
    <BarChart
      className="w-[42rem] max-w-full"
      label="Ergebnis pro Monat"
      data={result}
      x="monat"
      categoryLabel={monthName}
      series={[{ key: "ergebnis", label: "Ergebnis" }]}
      format={euro}
    />
  ),
};

const dollar = { style: "currency", currency: "USD" } as const;
const smallCosts = [
  { dienst: "Speicher", kosten: 0.83 },
  { dienst: "Bilder", kosten: 0.41 },
  { dienst: "E-Mail", kosten: 0.27 },
  { dienst: "Domains", kosten: 0.12 },
  { dienst: "Protokolle", kosten: 0.04 },
];

/**
 * Amounts under one dollar: the axis counts in quarters, and each line says its own value
 * („0,25 $“, „0,75 $“) with as many decimals as the quarter needs.
 */
export const SmallAmounts: Story = {
  name: "Small amounts",
  render: () => (
    <BarChart
      className="w-[42rem] max-w-full"
      label="Kosten pro Dienst im November"
      data={smallCosts}
      x="dienst"
      series={[{ key: "kosten", label: "Kosten" }]}
      format={dollar}
    />
  ),
};

const serviceDays = serviceCostDays();
const dayOfMonth = (row: { tag: string }) => `${Number(row.tag.slice(8))}.`;

/**
 * Series with an identity of their own name their colour: each service wears the series colour
 * nearest its brand whatever its place in the stack, and the remainder is the grey, last.
 */
export const NamedColours: Story = {
  name: "Named colours",
  render: () => (
    <BarChart
      className="w-[42rem] max-w-full"
      label="Kosten pro Tag nach Dienst"
      layout="stacked"
      data={serviceDays}
      x="tag"
      categoryLabel={dayOfMonth}
      series={costServices}
      format={dollar}
    />
  ),
};

const usd = new Intl.NumberFormat("de-DE", { style: "currency", currency: "USD" });
const serviceTotals = costServices.map((service) => ({
  ...service,
  trend: serviceDays.map((day) => day[service.key]),
  total: serviceDays.reduce((sum, day) => sum + day[service.key], 0),
}));

/**
 * One colour per service on a whole page: its part of each day's column, its part of the
 * month and its trend wear the same colour, so the swatch beside its name is the only legend
 * the page needs.
 */
export const OneColourPerService: Story = {
  name: "One colour per service",
  parameters: { visual: { viewport: { width: 1080, height: 440 } } },
  render: () => (
    <div className="grid w-[62rem] max-w-full grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card>
        <CardBar>
          <Heading level={2} size="label">
            Kosten pro Tag
          </Heading>
        </CardBar>
        <div className="px-5 pt-4 pb-5">
          <BarChart
            label="Kosten pro Tag nach Dienst"
            layout="stacked"
            data={serviceDays}
            x="tag"
            categoryLabel={dayOfMonth}
            series={costServices}
            format={dollar}
          />
        </div>
      </Card>
      <Card>
        <CardBar>
          <Heading level={2} size="label">
            Die letzten 14 Tage nach Dienst
          </Heading>
        </CardBar>
        <div className="flex flex-col gap-4 px-5 pt-4 pb-3">
          <SegmentedBar
            label="Kosten nach Dienst"
            size="tall"
            legend={false}
            data={serviceTotals.map((service) => ({
              name: service.label,
              value: service.total,
              color: service.color,
            }))}
            format={dollar}
          />
          <ul className="flex flex-col divide-y divide-hairline text-control">
            {serviceTotals.map((service) => (
              <li key={service.key} className="flex items-center gap-2 py-2">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: seriesPaint(service.color).fill }}
                />
                <span className="min-w-0 flex-1 truncate text-fg-body">{service.label}</span>
                <Sparkline
                  className="w-24 shrink-0"
                  data={service.trend}
                  color={service.color}
                  height={20}
                  drawIn={false}
                />
                <span className="w-20 shrink-0 text-right text-fg tabular-nums">
                  {usd.format(service.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  ),
};

const years = {
  "2026": months,
  "2025": months.map((row) => ({ ...row, umsatz: row.vorjahr })),
};

/** On a card; another year re-measures the columns, which rise and fall to their new heights. */
export const InACard: Story = {
  name: "In a card",
  parameters: {
    visual: {
      viewport: { width: 820, height: 480 },
      motion: [{ name: "year", click: '[data-step="year"]' }],
    },
  },
  render: function Render() {
    const [year, setYear] = useState<keyof typeof years>("2026");
    return (
      <Card className="w-[46rem] max-w-full">
        <CardBar>
          <Heading level={2} size="label">
            Umsatz pro Monat
          </Heading>
          <Button
            variant="secondary"
            size="sm"
            resize
            data-step="year"
            onClick={() => setYear(year === "2026" ? "2025" : "2026")}
          >
            {year === "2026" ? "Vorjahr zeigen" : "Dieses Jahr zeigen"}
          </Button>
        </CardBar>
        <div className="px-5 pt-4 pb-5">
          <BarChart
            label="Umsatz pro Monat"
            tone="accent"
            data={years[year]}
            x="monat"
            categoryLabel={monthName}
            series={[{ key: "umsatz", label: "Umsatz" }]}
            format={euro}
          />
        </div>
      </Card>
    );
  },
};

/** On a phone: every other month keeps its name. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 420 }, motion: [] } },
  render: () => (
    <BarChart
      className="w-full"
      label="Angebote pro Monat"
      height={200}
      data={[...quotes, ...quotes].map((row, index) => ({
        ...row,
        monat: `2026-${String((index % 12) + 1).padStart(2, "0")}-01`,
      }))}
      x="monat"
      categoryLabel={monthName}
      series={[
        { key: "erstellt", label: "Erstellt" },
        { key: "angenommen", label: "Angenommen" },
      ]}
    />
  ),
};

/** The keyboard walks the categories and each is said with its values. */
export const Keyboard: Story = {
  render: () => (
    <BarChart
      className="w-[42rem] max-w-full"
      label="Angebote pro Monat"
      data={quotes}
      x="monat"
      categoryLabel={monthName}
      series={[
        { key: "erstellt", label: "Erstellt" },
        { key: "angenommen", label: "Angenommen" },
      ]}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const plot = canvas.getByRole("group", { name: /Angebote pro Monat/ });
    await step(
      "Tab reaches the plot past the legend; the first arrow stands on the first month",
      async () => {
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.tab();
        await expect(plot).toHaveFocus();
        await userEvent.keyboard("{ArrowRight}");
        await waitFor(() =>
          expect(canvasElement.querySelector('[aria-live="polite"]')).toHaveTextContent(
            "Jun: Erstellt 18, Angenommen 11",
          ),
        );
      },
    );
    await step("End goes to the last month", async () => {
      await userEvent.keyboard("{End}");
      await waitFor(() =>
        // The month, then each series' value and name: „Nov · 24 Erstellt · 16 Angenommen“.
        expect(canvasElement.querySelector('[data-slot="chart-readout"]')).toHaveTextContent(
          /^Nov24Erstellt16Angenommen$/,
        ),
      );
    });
  },
};
