import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button/button";
import { CopyButton } from "@/components/copy-button/copy-button";

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

function Prompt({ variant }: { variant: "bevel" | "gloss" }) {
  const prompt =
    "Schreib Bäckerei Kornprobst, ob das Angebot vom 12. November noch Fragen offen lässt.";
  return (
    <Card variant={variant} className="w-96">
      <CardContent className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-fg-muted">Angebot nachfassen</span>
          <CopyButton text={prompt} size="sm" copyLabel="Vorlage kopieren" />
        </div>
        <p className="text-lg leading-snug font-medium text-balance text-fg">„{prompt}“</p>
        <p className="font-mono text-xs text-fg-muted">angebote_lesen · mail_entwurf</p>
      </CardContent>
    </Card>
  );
}

/**
 * `variant="bevel"` (Fase): a card cut like a fitting, for what is handled: an edge, light along
 * its top, a lip along its foot and a short shadow. The radio and checkbox cards wear it.
 */
export const Bevel: Story = {
  parameters: { visual: { viewport: { width: 460, height: 240 } } },
  render: () => <Prompt variant="bevel" />,
};

/** `variant="gloss"` (Glanz): the same cut with a face that shines, darker toward its foot. */
export const Gloss: Story = {
  parameters: { visual: { viewport: { width: 460, height: 240 } } },
  render: () => <Prompt variant="gloss" />,
};
