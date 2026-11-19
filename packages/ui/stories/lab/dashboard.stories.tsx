import { Invoice01Icon, Mail01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type CSSProperties, type ReactNode, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { Link } from "@/components/link/link";
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
import { cn } from "@/lib/cn";

import { AppFrame } from "../patterns/app-frame";

/**
 * Karte, less cardy (Justin, 2026-11-19: "super cardy … super airy … soft shadows … not a full
 * fan"). Two switches on the dashboard at real size: how a card's edge is drawn, and how many
 * blocks stand on cards. The edge is switched through the card's own depth variables, so no
 * new shadow is drawn here. Lab boards are not part of the library and go once the pick is made.
 */
type Args = {
  /**
   * `weich`: as built. `knapp`: without the wide soft shadow. (Without the close shade as well it
   * looked the same as `knapp` at real size, so that is not an option.)
   */
  kante: "weich" | "knapp";
  /** `alle`: as built. `gebuendelt`: the figures in one card. `liste`: only the list on a card. */
  karten: "alle" | "gebuendelt" | "liste";
};

const meta = {
  title: "Lab/Dashboard 2026-11-19",
  tags: ["visual-skip"],
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1180, height: 900 }, clip: "viewport" },
  },
  argTypes: {
    kante: {
      name: "Kante",
      control: { type: "inline-radio" },
      options: ["weich", "knapp"],
      description: "Wie eine Karte vom Grund absteht.",
    },
    karten: {
      name: "Karten",
      control: { type: "inline-radio" },
      options: ["alle", "gebuendelt", "liste"],
      description: "Welche Blöcke auf Karten stehen.",
    },
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

/** The card's depth variables per edge: `knapp` drops the wide soft layer. */
const edges: Record<Args["kante"], CSSProperties | undefined> = {
  weich: undefined,
  knapp: { "--depth-card-far": "transparent" } as CSSProperties,
};

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const QUOTES = [
  ["A-2026-0421", "Schreinerei Mustermann", "Einbauschrank Flur", 2780, "Entwurf", "neutral"],
  ["A-2026-0418", "Bäckerei Kornprobst", "Ladeneinrichtung", 4280, "Gesendet", "info"],
  ["A-2026-0412", "Friseursalon Haarscharf", "Empfangstresen", 1950, "Angenommen", "success"],
  ["A-2026-0409", "Gärtnerei Weiß", "Pflanztische", 5640, "Gesendet", "info"],
  ["A-2026-0397", "Elektro Wagner", "Werkbank", 3120, "Abgelaufen", "danger"],
] as const;

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

function Figures({ karten, accepted }: { karten: Args["karten"]; accepted: number }) {
  const figures = (
    <StatGroup
      variant={karten === "alle" ? "cards" : "ruled"}
      // Lab only: on the ground the row goes without its rule and reaches past the column by its
      // padding, so the figures' text stands on the column's edge.
      className={cn(karten === "liste" && "-mx-5 border-t-0 before:hidden max-sm:-mx-4")}
    >
      <Stat>
        <StatLabel>Umsatz im November</StatLabel>
        <StatValue>
          <RollingNumber
            value={12_480 + accepted * 4_280}
            format={{ style: "currency", currency: "EUR" }}
          />
        </StatValue>
        <StatChange trend="up" tone="positive" context="zum Vormonat">
          {accepted ? "+51 %" : "+12 %"}
        </StatChange>
      </Stat>
      <Stat>
        <StatLabel>Offene Angebote</StatLabel>
        <StatValue>
          <RollingNumber value={23 - accepted} />
        </StatValue>
        <StatChange trend={accepted ? "down" : "flat"} context="zur Vorwoche">
          {accepted ? "−1" : "±0"}
        </StatChange>
      </Stat>
      <Stat>
        <StatLabel>Angenommen im November</StatLabel>
        <StatValue>
          <RollingNumber value={9 + accepted} />
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
  );
  return karten === "gebuendelt" ? <Card>{figures}</Card> : figures;
}

function Recent({ accepted }: { accepted: number }) {
  return (
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
  );
}

function Board({ kante, karten }: Args) {
  const [accepted, setAccepted] = useState(0);
  return (
    <AppFrame page="uebersicht">
      {/* `contents`: the switch only sets the card's variables; the page's layout stays. */}
      <div className="contents" style={edges[kante]}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="flex flex-col gap-1">
            <Heading level={1} size="section">
              Übersicht.
            </Heading>
            <Text tone="muted">
              Guten Morgen, Maria. Seit gestern ist ein Angebot angenommen worden.
            </Text>
          </div>
          <Button variant="secondary" disabled={accepted > 0} onClick={() => setAccepted(1)}>
            <Icon icon={RefreshIcon} />
            Aktualisieren
          </Button>
        </div>

        <Figures karten={karten} accepted={accepted} />

        <div
          className={cn(
            "grid grid-cols-[minmax(0,1fr)] items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]",
            karten === "liste" ? "gap-x-10 gap-y-8" : "gap-6",
          )}
        >
          <Card className="min-w-0">
            <CardBar>
              <Heading level={2} size="label" id="neueste">
                Neueste Angebote
              </Heading>
              <Link href="#angebote" variant="quiet" className="text-sm text-fg-muted">
                Alle Angebote
              </Link>
            </CardBar>
            <Table aria-labelledby="neueste">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full">Kunde</TableHead>
                  <TableHead className="max-sm:hidden">Stand</TableHead>
                  <TableHead numeric>Betrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {QUOTES.map(([id, customer, subject, amount, status, tone]) => {
                  const now = accepted && id === "A-2026-0418";
                  const state = (
                    <Badge dot tone={now ? "success" : tone}>
                      {now ? "Angenommen" : status}
                    </Badge>
                  );
                  return (
                    <TableRow key={id} interactive>
                      <TableCell className="w-full max-w-0">
                        <div className="flex min-w-0 flex-col">
                          <a
                            href={`#angebot-${id}`}
                            className="truncate rounded-xs font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            {customer}
                          </a>
                          <span className="truncate text-sm text-fg-muted">
                            {id} · {subject}
                          </span>
                          <span className="pt-1 sm:hidden">{state}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-sm:hidden">{state}</TableCell>
                      <TableCell numeric>{euro.format(amount)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {karten === "liste" ? (
            <section aria-labelledby="zuletzt" className="flex min-w-0 flex-col gap-3">
              <Heading level={2} size="label" id="zuletzt" className="pt-3">
                Zuletzt
              </Heading>
              <Recent accepted={accepted} />
            </section>
          ) : (
            <Card role="region" aria-labelledby="zuletzt" className="min-w-0">
              <CardBar>
                <Heading level={2} size="label" id="zuletzt">
                  Zuletzt
                </Heading>
              </CardBar>
              <div className="px-5 pt-4 pb-5">
                <Recent accepted={accepted} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppFrame>
  );
}

/** As built: every block on a card with the soft, wide shadow. */
export const Heute: Story = {
  args: { kante: "weich", karten: "alle" },
  render: (args) => <Board {...args} />,
};

/** The same cards without the wide soft shadow: a crisp edge and a close shade under it. */
export const Knapp: Story = {
  args: { kante: "knapp", karten: "alle" },
  render: (args) => <Board {...args} />,
};

/**
 * Crisp edges, and the four figures in one card with hairlines between them: three cards on the
 * page instead of six.
 */
export const Gebuendelt: Story = {
  name: "Gebündelt (Vorschlag)",
  args: { kante: "knapp", karten: "gebuendelt" },
  render: (args) => <Board {...args} />,
};

/**
 * Only the list on a card: the figures stand on the ground with hairlines between them and no
 * rule, what happened lately under its heading.
 */
export const NurDieListe: Story = {
  name: "Nur die Liste",
  args: { kante: "knapp", karten: "liste" },
  render: (args) => <Board {...args} />,
};
