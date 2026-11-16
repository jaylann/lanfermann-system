import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button/button";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: { visual: { viewport: { width: 460, height: 340 } } },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One object you act on, with a quiet strip for what is secondary. */
export const Default: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Tarif Werkstatt.</CardTitle>
        <CardDescription>Website, Google-Profil und monatliche Pflege.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <p className="text-fg">
          <span className="text-2xl font-medium tabular-nums">89 €</span>
          <span className="text-fg-muted"> im Monat</span>
        </p>
        <Button variant="primary">Tarif wählen</Button>
      </CardContent>
      <CardFooter>Jährliche Abrechnung, jederzeit zum Jahresende kündbar.</CardFooter>
    </Card>
  ),
};
