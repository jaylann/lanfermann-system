import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";

import { Bullet, type BulletItem } from "./bullet";

const meta = {
  title: "Components/Bullet",
  component: Bullet,
  parameters: { layout: "padded", visual: { viewport: { width: 600, height: 320 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const euro = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;
const hours = { style: "unit", unit: "hour", unitDisplay: "short" } as const;

const goals: BulletItem[] = [
  { name: "Umsatz im November", value: 38_400, target: 50_000, bands: [30_000, 45_000] },
  { name: "Umsatz im Quartal", value: 131_800, target: 150_000, bands: [100_000, 140_000] },
  {
    name: "Abrechenbare Stunden",
    value: 142,
    target: 130,
    bands: [100, 125],
    format: hours,
  },
];

/** Goals and where they stand, each on its own scale: a tick for the goal, bands behind. */
export const Default: Story = {
  render: () => (
    <Bullet
      className="w-[32rem] max-w-full"
      aria-label="Ziele im November"
      data={goals}
      format={euro}
    />
  ),
};

/** Without bands: the bar and the goal alone. */
export const Plain: Story = {
  render: () => (
    <Bullet
      className="w-[32rem] max-w-full"
      aria-label="Budgets der Projekte"
      tone="accent"
      format={euro}
      data={[
        { name: "Website Schreinerei Mustermann", value: 7_840, target: 9_000 },
        { name: "Shop Gärtnerei Weiß", value: 12_300, target: 11_000 },
        { name: "Buchung Friseursalon Haarscharf", value: 2_100, target: 6_500 },
      ]}
    />
  ),
};

/** On a card, as on a dashboard. */
export const InACard: Story = {
  name: "In a card",
  parameters: { visual: { viewport: { width: 600, height: 380 } } },
  render: () => (
    <Card className="w-[34rem] max-w-full">
      <CardBar>
        <Heading level={2} size="label">
          Ziele im November
        </Heading>
      </CardBar>
      <div className="px-5 py-4">
        <Bullet aria-label="Ziele im November" data={goals} format={euro} />
      </div>
    </Card>
  ),
};

/** On a phone. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 320 } } },
  render: () => (
    <Bullet className="w-full" aria-label="Ziele im November" data={goals} format={euro} />
  ),
};
