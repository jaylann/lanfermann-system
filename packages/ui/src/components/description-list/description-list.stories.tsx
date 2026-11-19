import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "@/components/badge/badge";
import { buttonVariants } from "@/components/button/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card/card";

import { DescriptionDetails, DescriptionList, DescriptionTerm } from "./description-list";

const meta = {
  title: "Components/DescriptionList",
  component: DescriptionList,
  parameters: { visual: { viewport: { width: 640, height: 340 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** The facts of a quote. */
function Quote({ rule }: { rule?: boolean }) {
  return (
    <DescriptionList rule={rule}>
      <DescriptionTerm>Kunde</DescriptionTerm>
      <DescriptionDetails>Bäckerei Kornprobst, Rosenheim</DescriptionDetails>
      <DescriptionTerm>Angebotsnummer</DescriptionTerm>
      <DescriptionDetails
        action={
          <a href="#angebot" className={buttonVariants({ variant: "quiet", size: "sm" })}>
            Öffnen
          </a>
        }
      >
        A-2026-0418
      </DescriptionDetails>
      <DescriptionTerm>Gültig bis</DescriptionTerm>
      <DescriptionDetails>15. Dezember 2026</DescriptionDetails>
      <DescriptionTerm>Summe</DescriptionTerm>
      <DescriptionDetails>4.860,00 € netto</DescriptionDetails>
      <DescriptionTerm>Stand</DescriptionTerm>
      <DescriptionDetails>
        <Badge tone="info">Versendet</Badge>
      </DescriptionDetails>
    </DescriptionList>
  );
}

/**
 * The label muted in a column of its own, the value beside it, a hairline under each row, the
 * 2px rule above. An action stands at the end of its row.
 */
export const Default: Story = {
  render: () => (
    <div className="w-[560px]">
      <Quote />
    </div>
  ),
};

/** Inside a card the card's edge opens the list: `rule={false}`. */
export const InCard: Story = {
  parameters: { visual: { viewport: { width: 560, height: 420 } } },
  render: () => (
    <Card className="w-[480px]">
      <CardHeader>
        <CardTitle>Angebot</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <Quote rule={false} />
      </CardContent>
    </Card>
  ),
};

/** A long value breaks where it must; an address keeps its lines. */
export const LongValues: Story = {
  render: () => (
    <div className="w-[560px]">
      <DescriptionList>
        <DescriptionTerm>Rechnungsadresse</DescriptionTerm>
        <DescriptionDetails>
          Schreinerei Mustermann GmbH
          <br />
          Am Mühlbach 12
          <br />
          83022 Rosenheim
        </DescriptionDetails>
        <DescriptionTerm>IBAN</DescriptionTerm>
        <DescriptionDetails className="font-mono text-sm">
          DE89 3704 0044 0532 0130 00
        </DescriptionDetails>
        <DescriptionTerm>Hinweis für die Buchhaltung</DescriptionTerm>
        <DescriptionDetails>
          Bitte auf jeder Rechnung die Bestellnummer des Kunden angeben, sonst wird sie nicht
          zugeordnet.
        </DescriptionDetails>
      </DescriptionList>
    </div>
  ),
};

/** On a phone the value goes under its label. */
export const Phone: Story = {
  parameters: { layout: "padded", visual: { viewport: { width: 390, height: 520 } } },
  render: () => <Quote />,
};
