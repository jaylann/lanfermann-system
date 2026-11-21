import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "@/components/button/button";
import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";

import { SegmentedBar, type SegmentedBarItem } from "./segmented-bar";

const meta = {
  title: "Components/SegmentedBar",
  component: SegmentedBar,
  parameters: { layout: "padded", visual: { viewport: { width: 620, height: 200 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const euro = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;

const invoices: SegmentedBarItem[] = [
  { name: "Bezahlt", value: 41_280 },
  { name: "Offen", value: 12_940 },
  { name: "Überfällig", value: 3_120 },
];

const services: SegmentedBarItem[] = [
  { name: "Umsetzung", value: 180_000 },
  { name: "Beratung", value: 52_000 },
  { name: "Wartung", value: 27_600 },
  { name: "Schulung", value: 9_400 },
];

/** One whole, thin, with its parts named under it. */
export const Thin: Story = {
  render: () => (
    <SegmentedBar
      className="w-[34rem] max-w-full"
      label="Rechnungen nach Stand"
      data={invoices}
      format={euro}
    />
  ),
};

/** Standing alone, tall: each part's share printed in it, where it fits. */
export const Tall: Story = {
  render: () => (
    <SegmentedBar
      className="w-[34rem] max-w-full"
      label="Umsatz nach Leistung"
      size="tall"
      data={services}
      format={euro}
    />
  ),
};

/** A part too narrow for its share prints none; the legend and the name still carry it. */
export const NarrowParts: Story = {
  name: "Narrow parts",
  render: () => (
    <SegmentedBar
      className="w-80"
      label="Speicher nach Art"
      size="tall"
      data={[
        { name: "Angebote", value: 2_140 },
        { name: "Rechnungen", value: 860 },
        { name: "Fotos", value: 140 },
        { name: "Sonstiges", value: 40 },
      ]}
    />
  ),
};

/** Above a list that names the parts and their amounts: thin, without a legend. */
export const InAList: Story = {
  name: "In a list",
  parameters: { visual: { viewport: { width: 520, height: 320 } } },
  render: () => (
    <Card className="w-[28rem] max-w-full">
      <CardBar>
        <Heading level={2} size="label">
          Rechnungen im November
        </Heading>
      </CardBar>
      <div className="flex flex-col gap-4 px-5 py-4">
        <SegmentedBar label="Rechnungen nach Stand" data={invoices} format={euro} legend={false} />
        <ul className="flex flex-col divide-y divide-hairline text-control">
          {invoices.map((item, index) => (
            <li key={item.name} className="flex items-center gap-2 py-2">
              <span
                aria-hidden
                className="size-2.5 rounded-[3px]"
                style={{ backgroundColor: `var(--lf-series-${index + 1})` }}
              />
              <span className="text-fg-body">{item.name}</span>
              <span className="ml-auto text-fg tabular-nums">
                {item.value.toLocaleString("de-DE")} €
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  ),
};

const months: SegmentedBarItem[][] = [
  invoices,
  [
    { name: "Bezahlt", value: 52_800 },
    { name: "Offen", value: 6_100 },
    { name: "Überfällig", value: 900 },
  ],
];

/** When the parts change, the cuts between them glide to their new places. */
export const Change: Story = {
  parameters: {
    visual: {
      viewport: { width: 620, height: 240 },
      motion: [{ name: "month", click: '[data-step="month"]' }],
    },
  },
  render: function Render() {
    const [month, setMonth] = useState(0);
    return (
      <div className="flex w-[34rem] max-w-full flex-col gap-5">
        <SegmentedBar
          label="Rechnungen nach Stand"
          size="tall"
          data={months[month]!}
          format={euro}
        />
        <Button
          variant="secondary"
          size="sm"
          resize
          className="self-start"
          data-step="month"
          onClick={() => setMonth(1 - month)}
        >
          {month === 0 ? "Dezember zeigen" : "November zeigen"}
        </Button>
      </div>
    );
  },
};
