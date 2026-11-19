import { Invoice01Icon, Mail01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { Meter, MeterTrack } from "@/components/meter/meter";
import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { Stat, StatChange, StatGroup, StatLabel, StatValue } from "@/components/stat/stat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";
import { Text } from "@/components/text/text";
import { Timeline, TimelineGroup, TimelineItem } from "@/components/timeline/timeline";

import { AppFrame } from "./app-frame";

const meta = {
  title: "Patterns/Dashboard",
  parameters: {
    layout: "fullscreen",
    visual: {
      viewport: { width: 1180, height: 900 },
      clip: "viewport",
      motion: [{ name: "refresh", click: '[data-step="refresh"]' }],
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const QUOTES = [
  ["A-2026-0421", "Schreinerei Mustermann", "Einbauschrank Flur", 2780, "Entwurf", "neutral"],
  ["A-2026-0418", "Bäckerei Kornprobst", "Ladeneinrichtung", 4280, "Gesendet", "info"],
  ["A-2026-0412", "Friseursalon Haarscharf", "Empfangstresen", 1950, "Angenommen", "success"],
  ["A-2026-0409", "Gärtnerei Weiß", "Pflanztische", 5640, "Gesendet", "info"],
  ["A-2026-0397", "Elektro Wagner", "Werkbank", 3120, "Abgelaufen", "danger"],
] as const;

/** A record number or an amount: it does not break at its hyphen or before its unit. */
function Whole({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap">{children}</span>;
}

function Person({ initials }: { initials: string }) {
  return (
    <Avatar size="sm">
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

/**
 * The first page after sign-in: the figures, the latest quotes, what happened lately.
 * „Aktualisieren“ brings in an accepted quote: the figures roll and the entry joins the
 * timeline. A test board for the parts together, not a template for a page.
 */
function Board() {
  const [accepted, setAccepted] = useState(0);
  const revenue = 12_480 + accepted * 4_280;
  const open = 23 - accepted;
  const won = 9 + accepted;
  return (
    <AppFrame page="uebersicht">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex flex-col gap-1">
          <Heading level={1} size="section">
            Übersicht.
          </Heading>
          <Text tone="muted">
            Guten Morgen, Maria. Seit gestern ist ein Angebot angenommen worden.
          </Text>
        </div>
        <Button
          variant="secondary"
          data-step="refresh"
          disabled={accepted > 0}
          onClick={() => setAccepted(1)}
        >
          <Icon icon={RefreshIcon} />
          Aktualisieren
        </Button>
      </div>

      <StatGroup>
        <Stat>
          <StatLabel>Umsatz im November</StatLabel>
          <StatValue>
            <RollingNumber value={revenue} format={{ style: "currency", currency: "EUR" }} />
          </StatValue>
          <StatChange trend="up" tone="positive" context="zum Vormonat">
            {accepted ? "+51 %" : "+12 %"}
          </StatChange>
        </Stat>
        <Stat>
          <StatLabel>Offene Angebote</StatLabel>
          <StatValue>
            <RollingNumber value={open} />
          </StatValue>
          <StatChange trend={accepted ? "down" : "flat"} context="zur Vorwoche">
            {accepted ? "−1" : "±0"}
          </StatChange>
        </Stat>
        <Stat>
          <StatLabel>Angenommen im November</StatLabel>
          <StatValue>
            <RollingNumber value={won} />
          </StatValue>
          <StatChange trend="up" tone="positive" context="zum Vormonat">
            {accepted ? "+4" : "+3"}
          </StatChange>
        </Stat>
        <Stat>
          <StatLabel>Angebote im Tarif</StatLabel>
          <StatValue>
            38 <span className="text-base font-normal text-fg-muted">von 50 im Monat</span>
          </StatValue>
          <Meter value={38} max={50} aria-label="Angebote im Tarif genutzt">
            <MeterTrack />
          </Meter>
        </Stat>
      </StatGroup>

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Not a region of its own: the table is one, named by the heading. */}
        <div className="flex min-w-0 flex-col gap-3">
          <Heading level={2} size="label" id="neueste">
            Neueste Angebote
          </Heading>
          <Table aria-labelledby="neueste">
            <TableHeader>
              <TableRow>
                <TableHead>Kunde</TableHead>
                <TableHead>Stand</TableHead>
                <TableHead numeric>Betrag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {QUOTES.map(([id, customer, subject, amount, status, tone]) => {
                const now = accepted && id === "A-2026-0418";
                return (
                  <TableRow key={id} interactive>
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-fg">{customer}</span>
                        <span className="truncate text-sm text-fg-muted">
                          {id} · {subject}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge tone={now ? "success" : tone}>{now ? "Angenommen" : status}</Badge>
                    </TableCell>
                    <TableCell numeric>{euro.format(amount)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <section aria-labelledby="zuletzt" className="flex min-w-0 flex-col gap-3">
          <Heading level={2} size="label" id="zuletzt">
            Zuletzt
          </Heading>
          <Timeline>
            <TimelineGroup label="Heute" dateTime="2026-11-19">
              {accepted > 0 && (
                <TimelineItem time="15:02" avatar={<Person initials="BK" />}>
                  <strong>Bäckerei Kornprobst</strong> hat das Angebot <Whole>A-2026-0418</Whole>{" "}
                  angenommen.
                </TimelineItem>
              )}
              <TimelineItem time="14:32" avatar={<Person initials="FH" />}>
                <strong>Friseursalon Haarscharf</strong> hat das Angebot <Whole>A-2026-0412</Whole>{" "}
                angenommen.
              </TimelineItem>
              <TimelineItem time="11:05" icon={Mail01Icon}>
                Das Angebot <Whole>A-2026-0418</Whole> wurde versendet.
              </TimelineItem>
            </TimelineGroup>
            <TimelineGroup label="Gestern" dateTime="2026-11-18">
              <TimelineItem time="16:20" icon={Invoice01Icon}>
                Die Rechnung <Whole>R-2026-0112</Whole> über <Whole>1.240,00 €</Whole> ist bezahlt.
              </TimelineItem>
              <TimelineItem time="08:30" avatar={<Person initials="JK" />}>
                <strong>Jonas Klein</strong> hat das Angebot <Whole>A-2026-0421</Whole> angelegt.
              </TimelineItem>
            </TimelineGroup>
          </Timeline>
        </section>
      </div>
    </AppFrame>
  );
}

export const Dashboard: Story = { render: () => <Board /> };

/** On a phone: the figures two by two, the list and the timeline under each other. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 1400 }, motion: [] } },
  render: () => <Board />,
};
