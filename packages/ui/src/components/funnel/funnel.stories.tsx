import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "@/components/button/button";
import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";

import { Funnel, type FunnelStep } from "./funnel";

const meta = {
  title: "Components/Funnel",
  component: Funnel,
  parameters: { layout: "padded", visual: { viewport: { width: 560, height: 320 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const quotes: FunnelStep[] = [
  { name: "Angebot erstellt", value: 124 },
  { name: "Angebot gesendet", value: 108 },
  { name: "Angebot angesehen", value: 71 },
  { name: "Angebot angenommen", value: 38 },
];

/** Quotes on their way: each step's share of the one before, the loss as the gap. */
export const Default: Story = {
  render: () => (
    <Funnel className="w-[30rem] max-w-full" aria-label="Angebote im November" data={quotes} />
  ),
};

/** Measured against the first step: how many of all quotes get this far. */
export const FromTheFirst: Story = {
  name: "From the first",
  render: () => (
    <Funnel
      className="w-[30rem] max-w-full"
      aria-label="Angebote im November"
      data={quotes}
      rate="first"
      tone="accent"
    />
  ),
};

const months: FunnelStep[][] = [
  quotes,
  [
    { name: "Angebot erstellt", value: 131 },
    { name: "Angebot gesendet", value: 122 },
    { name: "Angebot angesehen", value: 98 },
    { name: "Angebot angenommen", value: 61 },
  ],
];

/** On a card; another month moves the bars to their new lengths. */
export const InACard: Story = {
  name: "In a card",
  parameters: {
    visual: {
      viewport: { width: 560, height: 400 },
      motion: [{ name: "month", click: '[data-step="month"]' }],
    },
  },
  render: function Render() {
    const [month, setMonth] = useState(0);
    return (
      <Card className="w-[30rem] max-w-full">
        <CardBar>
          <Heading level={2} size="label">
            Vom Angebot zum Auftrag
          </Heading>
          <Button
            variant="secondary"
            size="sm"
            resize
            data-step="month"
            onClick={() => setMonth(1 - month)}
          >
            {month === 0 ? "Dezember zeigen" : "November zeigen"}
          </Button>
        </CardBar>
        <div className="px-5 py-4">
          <Funnel aria-label="Vom Angebot zum Auftrag" data={months[month]!} />
        </div>
      </Card>
    );
  },
};

/** On a phone, the counts keep their room and the names give way. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 320 }, motion: [] } },
  render: () => <Funnel className="w-full" aria-label="Angebote im November" data={quotes} />,
};
