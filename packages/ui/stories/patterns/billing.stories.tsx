import { Download01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge } from "@/components/badge/badge";
import { Banner } from "@/components/banner/banner";
import { Button } from "@/components/button/button";
import { Card, CardBar, CardFooter } from "@/components/card/card";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list/description-list";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { Link } from "@/components/link/link";
import { Meter, MeterLabel, MeterTrack, MeterValue } from "@/components/meter/meter";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/components/page-header/page-header";
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
import { formatMoney, formatNumber } from "@/lib/format";

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
      <MeterValue>{() => `${formatNumber(value)} von ${formatNumber(max)} ${unit}`}</MeterValue>
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
      <PageHeader>
        <PageHeaderTitle>Abrechnung.</PageHeaderTitle>
        <PageHeaderDescription>
          Ihr Tarif, was Sie davon nutzen, und Ihre Rechnungen.
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        <Card role="region" aria-labelledby="tarif" className="min-w-0">
          <CardBar>
            <Heading level={2} size="label" id="tarif">
              Ihr Tarif
            </Heading>
            <Link href="#tarife" variant="quiet" className="text-sm text-fg-muted">
              Tarife vergleichen
            </Link>
          </CardBar>
          <div className="flex flex-col gap-1 px-5 pt-4">
            <p className="text-lg leading-snug font-semibold text-fg">Werkstatt</p>
            <Text tone="muted">Für Betriebe mit bis zu fünf Leuten.</Text>
          </div>
          <div className="px-5 pt-2 pb-2">
            <DescriptionList rule={false} className="[--dl-term:9rem]">
              <DescriptionTerm>Preis</DescriptionTerm>
              <DescriptionDetails>{formatMoney(29)} im Monat</DescriptionDetails>
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
          </div>
          <CardFooter className="px-5">Der Tarif lässt sich zum Monatsende wechseln.</CardFooter>
        </Card>

        <Card role="region" aria-labelledby="nutzung" className="min-w-0">
          <CardBar>
            <Heading level={2} size="label" id="nutzung">
              Nutzung im November
            </Heading>
          </CardBar>
          <div className="flex flex-col gap-5 px-5 pt-4 pb-5">
            <Usage label="Angebote" value={38} max={50} unit="Angeboten" />
            <Usage label="Speicher" value={3.2} max={5} unit="GB" />
            <Usage label="Team" value={4} max={5} unit="Personen" />
          </div>
        </Card>
      </div>

      {/* Not a region of its own: the table is one, named by the heading. */}
      <Card>
        <CardBar>
          <Heading level={2} size="label" id="rechnungen">
            Rechnungen
          </Heading>
        </CardBar>
        <Table aria-labelledby="rechnungen">
          <TableHeader>
            <TableRow>
              <TableHead className="w-full">Rechnung</TableHead>
              <TableHead className="max-sm:hidden">Datum</TableHead>
              <TableHead className="max-sm:hidden">Stand</TableHead>
              <TableHead numeric>Betrag</TableHead>
              <TableHead className="w-0">
                <span className="sr-only">Herunterladen</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVOICES.map(([id, date, amount, status, tone]) => {
              const paid = id === "R-2026-0011" && !failed;
              const state = (
                <Badge dot tone={paid ? "success" : tone}>
                  {paid ? "Bezahlt" : status}
                </Badge>
              );
              return (
                <TableRow key={id}>
                  <TableCell className="whitespace-nowrap">
                    <span className="block font-medium text-fg">{id}</span>
                    {/* On a phone the date's and the state's columns give way: they stand under
                      the number, as the state of a quote does on the dashboard. */}
                    <span className="block text-sm text-fg-muted sm:hidden">{date}</span>
                    <span className="block pt-1 sm:hidden">{state}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap max-sm:hidden">{date}</TableCell>
                  <TableCell className="max-sm:hidden">{state}</TableCell>
                  <TableCell numeric>{formatMoney(amount)}</TableCell>
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
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppFrame>
  );
}

export const Billing: Story = { render: () => <Board /> };

/** On a phone: the plan, the usage and the invoices under each other. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 1500 }, motion: [] } },
  render: () => <Board />,
};
