import { Download01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge } from "@/components/badge/badge";
import { Banner } from "@/components/banner/banner";
import { Button } from "@/components/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card/card";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list/description-list";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { Meter, MeterLabel, MeterTrack, MeterValue } from "@/components/meter/meter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";
import { Text } from "@/components/text/text";
import { toast } from "@/components/toast/toast";

import { AppFrame } from "./app-frame";

const meta = {
  title: "Patterns/Billing",
  parameters: {
    layout: "fullscreen",
    visual: {
      viewport: { width: 1180, height: 900 },
      clip: "viewport",
      motion: [{ name: "resolve", click: '[data-step="resolve"]' }],
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const INVOICES = [
  ["R-2026-0011", "1. November 2026", 29, "Offen", "warning"],
  ["R-2026-0010", "1. Oktober 2026", 29, "Bezahlt", "success"],
  ["R-2026-0009", "1. September 2026", 29, "Bezahlt", "success"],
  ["R-2026-0008", "1. August 2026", 19, "Bezahlt", "success"],
] as const;

/** One amount of the plan against its limit, said as people count it. */
function Usage({
  label,
  value,
  max,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
}) {
  return (
    <Meter value={value} max={max} locale="de-DE">
      <MeterLabel>{label}</MeterLabel>
      <MeterValue>{() => `${value.toLocaleString("de-DE")} von ${max} ${unit}`}</MeterValue>
      <MeterTrack />
    </Meter>
  );
}

/**
 * What the workshop pays: the payment that failed, as a notice for the whole page, the plan and
 * its usage, and the invoices. „Zahlungsmethode ändern“ settles it: the banner leaves and the
 * page follows it up. A test board for the parts together, not a template for a page.
 */
function Board() {
  const [failed, setFailed] = useState(true);
  return (
    <AppFrame
      page="abrechnung"
      banner={
        <Banner
          open={failed}
          onOpenChange={setFailed}
          tone="danger"
          dismissible={false}
          title="Die Zahlung vom 1. November ist fehlgeschlagen."
          action={
            <Button
              size="sm"
              data-step="resolve"
              onClick={() => {
                setFailed(false);
                toast({ title: "Zahlungsmethode geändert.", tone: "success" });
              }}
            >
              Zahlungsmethode ändern
            </Button>
          }
        >
          Prüfen Sie Ihre Karte, damit Ihr Tarif weiterläuft.
        </Banner>
      }
    >
      <div className="flex flex-col gap-1">
        <Heading level={1} size="section">
          Abrechnung.
        </Heading>
        <Text tone="muted">Ihr Tarif, was Sie davon nutzen, und Ihre Rechnungen.</Text>
      </div>

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        <section aria-labelledby="tarif" className="flex min-w-0 flex-col gap-3">
          <Heading level={2} size="label" id="tarif">
            Ihr Tarif
          </Heading>
          <Card>
            <CardHeader>
              <CardTitle>Werkstatt</CardTitle>
              <CardDescription>Für Betriebe mit bis zu fünf Leuten.</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <DescriptionList rule={false} className="[--dl-term:9rem]">
                <DescriptionTerm>Preis</DescriptionTerm>
                <DescriptionDetails>29,00 € im Monat</DescriptionDetails>
                <DescriptionTerm>Nächste Rechnung</DescriptionTerm>
                <DescriptionDetails>1. Dezember 2026</DescriptionDetails>
                <DescriptionTerm>Zahlungsmethode</DescriptionTerm>
                <DescriptionDetails>
                  {failed ? (
                    <span className="flex flex-wrap items-center gap-2">
                      Visa, endet auf 4242 <Badge tone="danger">Abgelehnt</Badge>
                    </span>
                  ) : (
                    "Visa, endet auf 1881"
                  )}
                </DescriptionDetails>
                <DescriptionTerm>Rechnung an</DescriptionTerm>
                <DescriptionDetails>buchhaltung@schreinerei-huber.de</DescriptionDetails>
              </DescriptionList>
            </CardContent>
            <CardFooter>Der Tarif lässt sich zum Monatsende wechseln.</CardFooter>
          </Card>
        </section>

        <section aria-labelledby="nutzung" className="flex min-w-0 flex-col gap-5">
          <Heading level={2} size="label" id="nutzung">
            Nutzung im November
          </Heading>
          <Usage label="Angebote" value={38} max={50} unit="Angeboten" />
          <Usage label="Speicher" value={3.2} max={5} unit="GB" />
          <Usage label="Team" value={4} max={5} unit="Personen" />
        </section>
      </div>

      {/* Not a region of its own: the table is one, named by the heading. */}
      <div className="flex flex-col gap-3">
        <Heading level={2} size="label" id="rechnungen">
          Rechnungen
        </Heading>
        <Table aria-labelledby="rechnungen">
          <TableHeader>
            <TableRow>
              <TableHead>Rechnung</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Stand</TableHead>
              <TableHead numeric>Betrag</TableHead>
              <TableHead className="w-0">
                <span className="sr-only">Herunterladen</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICES.map(([id, date, amount, status, tone]) => (
              <TableRow key={id}>
                <TableCell className="font-medium text-fg">{id}</TableCell>
                <TableCell>{date}</TableCell>
                <TableCell>
                  <Badge tone={id === "R-2026-0011" && !failed ? "success" : tone}>
                    {id === "R-2026-0011" && !failed ? "Bezahlt" : status}
                  </Badge>
                </TableCell>
                <TableCell numeric>{euro.format(amount)}</TableCell>
                <TableCell className="w-0">
                  <Button
                    size="sm"
                    variant="quiet"
                    iconOnly
                    aria-label={`Rechnung ${id} herunterladen`}
                    onClick={() => toast({ title: `Rechnung ${id} wird heruntergeladen.` })}
                  >
                    <Icon icon={Download01Icon} size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppFrame>
  );
}

export const Billing: Story = { render: () => <Board /> };

/** On a phone: the plan, the usage and the invoices under each other. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 1500 }, motion: [] } },
  render: () => <Board />,
};
