import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "@/components/button/button";
import { Meter, MeterTrack } from "@/components/meter/meter";
import { RollingNumber } from "@/components/rolling-number/rolling-number";

import { Stat, StatChange, StatGroup, StatLabel, StatValue } from "./stat";

const meta = {
  title: "Components/Stat",
  component: Stat,
  parameters: { visual: { viewport: { width: 360, height: 180 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const euro = { style: "currency", currency: "EUR" } as const;

/** One figure: what it is, the figure, and how it moved against what. */
export const Default: Story = {
  render: () => (
    <Stat className="w-64">
      <StatLabel>Umsatz im November</StatLabel>
      <StatValue>12.480,00 €</StatValue>
      <StatChange trend="up" tone="positive" context="gegenüber dem Vormonat">
        +12 %
      </StatChange>
    </Stat>
  ),
};

/** The figures of a dashboard, the first thing after sign-in. */
function Figures({ variant }: { variant?: "ruled" | "cards" }) {
  return (
    <StatGroup variant={variant} className="w-full max-w-4xl">
      <Stat>
        <StatLabel>Umsatz im November</StatLabel>
        <StatValue>12.480,00 €</StatValue>
        <StatChange trend="up" tone="positive" context="gegenüber dem Vormonat">
          +12 %
        </StatChange>
      </Stat>
      <Stat>
        <StatLabel>Offene Angebote</StatLabel>
        <StatValue>23</StatValue>
        <StatChange trend="flat" context="wie in der Vorwoche">
          ±0
        </StatChange>
      </Stat>
      <Stat>
        <StatLabel>Stornierungen</StatLabel>
        <StatValue>4</StatValue>
        <StatChange trend="up" tone="negative" context="gegenüber dem Vormonat">
          +2
        </StatChange>
      </Stat>
      <Stat>
        <StatLabel>Speicher</StatLabel>
        <StatValue>
          3,2 GB <span className="text-base font-normal text-fg-muted">von 5 GB</span>
        </StatValue>
        <Meter value={64} aria-label="Speicher belegt">
          <MeterTrack />
        </Meter>
      </Stat>
    </StatGroup>
  );
}

/**
 * Four figures in a ruled row, the other form: the 2px rule opens it, hairlines stand between the
 * figures, and nothing casts a shadow. One shows usage against the plan; one a change that is bad
 * news.
 */
export const Row: Story = {
  parameters: { layout: "padded", visual: { viewport: { width: 1000, height: 200 } } },
  render: () => <Figures variant="ruled" />,
};

/** Each figure on a card of its own, as the other blocks of an app's page stand on cards. */
export const Cards: Story = {
  parameters: { layout: "padded", visual: { viewport: { width: 1000, height: 220 } } },
  render: () => <Figures />,
};

/** On a phone the figures stand two by two. */
export const Phone: Story = {
  parameters: { layout: "padded", visual: { viewport: { width: 390, height: 360 } } },
  render: () => <Figures />,
};

/**
 * A figure that changes while it is on screen rolls to its new value; when the trend turns, the
 * arrow turns with it.
 */
export const Changing: Story = {
  parameters: {
    visual: {
      viewport: { width: 380, height: 220 },
      motion: [
        { name: "payment", click: '[data-step="up"]' },
        { name: "refund", click: '[data-step="down"]' },
      ],
    },
  },
  render: function Render() {
    const [value, setValue] = useState(12_480);
    const [before] = useState(11_142);
    const change = (value - before) / before;
    const trend = change > 0.0005 ? "up" : change < -0.0005 ? "down" : "flat";
    return (
      <div className="flex w-72 flex-col gap-4">
        <Stat>
          <StatLabel>Umsatz im November</StatLabel>
          <StatValue>
            <RollingNumber value={value} format={euro} />
          </StatValue>
          <StatChange
            trend={trend}
            tone={trend === "up" ? "positive" : trend === "down" ? "negative" : "neutral"}
            context="gegenüber dem Vormonat"
          >
            {new Intl.NumberFormat("de-DE", {
              style: "percent",
              maximumFractionDigits: 0,
              signDisplay: "exceptZero",
            }).format(change)}
          </StatChange>
        </Stat>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            data-step="up"
            onClick={() => setValue((current) => current + 1_250)}
          >
            Zahlung eingegangen
          </Button>
          <Button
            size="sm"
            variant="secondary"
            data-step="down"
            onClick={() => setValue((current) => current - 2_890)}
          >
            Erstattung
          </Button>
        </div>
      </div>
    );
  },
};
