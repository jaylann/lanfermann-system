import { Invoice01Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { AvatarGroup } from "@/components/avatar-group/avatar-group";
import type { AvatarPerson } from "@/components/avatar-group/people";
import { Banner } from "@/components/banner/banner";
import { Button } from "@/components/button/button";
import { buttonVariants } from "@/components/button/button-variants";
import { Meter, MeterTrack } from "@/components/meter/meter";
import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { Stat, StatChange, StatGroup, StatLabel, StatValue } from "@/components/stat/stat";
import { Timeline, TimelineGroup, TimelineItem } from "@/components/timeline/timeline";
import { cn } from "@/lib/cn";

/**
 * The open picks of the dashboard parts (issue #32), each as its options side by side at real
 * size. Lab boards are not part of the library: they are left out of the pictures and go when
 * the picks are made.
 */
const meta = {
  title: "Lab/Picks 2026-11-19",
  tags: ["visual-skip"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** One option of a pick: what it is, above what it looks like. */
function Option({
  name,
  note,
  className,
  children,
}: {
  name: string;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={name} className={cn("flex flex-col gap-3", className)}>
      <p className="flex items-baseline gap-2 text-sm">
        <span className="font-semibold text-fg">{name}</span>
        {note && <span className="text-fg-muted">{note}</span>}
      </p>
      {children}
    </section>
  );
}

function Figures({ variant }: { variant: "ruled" | "cards" }) {
  return (
    <StatGroup variant={variant} className="w-full">
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
        <Meter value={64} aria-label={`Speicher belegt (${variant})`}>
          <MeterTrack />
        </Meter>
      </Stat>
    </StatGroup>
  );
}

/** Pick 1: the figures of a dashboard stand in one ruled row, or each on a card. */
export const StatRow: Story = {
  render: () => (
    <div className="flex max-w-5xl flex-col gap-10">
      <Option name="Gerahmte Zeile" note="gebaut, Vorschlag: eine Linie öffnet, Haarlinien trennen">
        <Figures variant="ruled" />
      </Option>
      <Option name="Karten" note="jede Zahl auf einer eigenen Karte">
        <Figures variant="cards" />
      </Option>
    </div>
  ),
};

/** Pick 2: how a digit comes to rest. Both roll from the same keys. */
export const RollingSpring: Story = {
  render: function Render() {
    const [value, setValue] = useState(12_480);
    const steps = [1, 7, 128, -128, 2_500];
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <Button
              key={step}
              size="sm"
              variant="secondary"
              onClick={() => setValue((current) => current + step)}
            >
              {step > 0 ? `+${step}` : `−${-step}`}
            </Button>
          ))}
        </div>
        <div className="flex gap-16">
          <Option name="settle" note="ohne Nachschwingen, Vorschlag">
            <p className="text-2xl font-medium text-fg">
              <RollingNumber value={value} format={{ style: "currency", currency: "EUR" }} />
            </p>
          </Option>
          <Option name="seat" note="mit leichtem Nachschwingen">
            <p className="text-2xl font-medium text-fg">
              <RollingNumber
                value={value}
                spring="seat"
                format={{ style: "currency", currency: "EUR" }}
              />
            </p>
          </Option>
        </div>
      </div>
    );
  },
};

const team: AvatarPerson[] = [
  { name: "Anna Weber", presence: "online" },
  { name: "Jonas Klein" },
  { name: "Lena Fischer" },
  { name: "Paul Wagner" },
  { name: "Mia Becker" },
  { name: "Tom Richter" },
];

/** Pick 3: how far one avatar lies over the next. */
export const AvatarOverlap: Story = {
  render: () => (
    <div className="flex gap-16">
      {(["loose", "tight"] as const).map((overlap) => (
        <Option
          key={overlap}
          name={overlap === "loose" ? "Ein Viertel" : "Ein Drittel"}
          note={overlap === "loose" ? "Vorschlag" : undefined}
        >
          <div className="flex flex-col items-start gap-4">
            {(["sm", "md", "lg", "xl"] as const).map((size) => (
              <AvatarGroup
                key={size}
                size={size}
                overlap={overlap}
                people={team}
                label={`${overlap} ${size}`}
              />
            ))}
          </div>
        </Option>
      ))}
    </div>
  ),
};

/** Pick 4: how wide the cut between two avatars is. Shown large, where it shows most. */
export const AvatarGap: Story = {
  render: () => (
    <div className="flex gap-16">
      {([2, 3] as const).map((gap) => (
        <Option key={gap} name={`${gap} px`} note={gap === 2 ? "Vorschlag" : undefined}>
          <div className="flex flex-col items-start gap-4">
            {(["md", "lg", "xl"] as const).map((size) => (
              <AvatarGroup
                key={size}
                size={size}
                gap={gap}
                people={team}
                label={`${gap} ${size}`}
              />
            ))}
            <div className="rounded-lg bg-tint p-3">
              <AvatarGroup size="lg" gap={gap} people={team} label={`${gap} auf Tint`} />
            </div>
          </div>
        </Option>
      ))}
    </div>
  ),
};

/** A page column for the banner to stand in. */
function Column({ layout }: { layout: "bleed" | "inset" }) {
  return (
    <div className="overflow-hidden rounded-xl bg-ground inset-ring inset-ring-hairline">
      <div className="flex h-11 items-center border-b border-hairline px-5 text-sm text-fg-muted">
        Schreinerei Mustermann · Übersicht
      </div>
      <div className={cn(layout === "inset" && "px-5 pt-5")}>
        <Banner
          layout={layout}
          tone="warning"
          title="Ihre Testphase endet in drei Tagen."
          action={
            <a href="#tarif" className={buttonVariants({ size: "sm" })}>
              Tarif wählen
            </a>
          }
        >
          Wählen Sie einen Tarif, damit Ihre Angebote erhalten bleiben.
        </Banner>
      </div>
      <div className="flex flex-col gap-2 px-5 py-5">
        <h2 className="text-xl font-medium text-fg">Übersicht.</h2>
        <p className="max-w-prose text-fg-body">
          12 offene Angebote, 3 davon laufen diese Woche ab.
        </p>
      </div>
    </div>
  );
}

/** Pick 5: a wash across the full width, or a strip set into the page's column. */
export const BannerLayout: Story = {
  render: () => (
    <div className="grid max-w-6xl grid-cols-2 gap-10">
      <Option name="Über die volle Breite" note="Vorschlag">
        <Column layout="bleed" />
      </Option>
      <Option name="In der Spalte">
        <Column layout="inset" />
      </Option>
    </div>
  ),
};

function Person({ initials }: { initials: string }) {
  return (
    <Avatar size="sm">
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

function Recent({ lead }: { lead: "marks" | "avatars" | "mixed" }) {
  const person = (initials: string) =>
    lead === "marks" ? undefined : <Person initials={initials} />;
  const system = (initials: string) =>
    lead === "avatars" ? <Person initials={initials} /> : undefined;
  const symbol = (icon: typeof Mail01Icon) => (lead === "mixed" ? icon : undefined);
  return (
    <Timeline>
      <TimelineGroup label="Heute">
        <TimelineItem time="14:32" avatar={person("AW")}>
          <strong>Anna Weber</strong> hat ein Angebot angenommen.
        </TimelineItem>
        <TimelineItem time="11:05" avatar={system("JK")} icon={symbol(Mail01Icon)}>
          Ein Angebot wurde versendet.
        </TimelineItem>
        <TimelineItem time="09:12" avatar={person("JK")}>
          <strong>Jonas Klein</strong> hat <strong>Lena Fischer</strong> eingeladen.
        </TimelineItem>
      </TimelineGroup>
      <TimelineGroup label="Gestern">
        <TimelineItem time="17:48" tone="danger">
          Eine Zahlung ist fehlgeschlagen.
        </TimelineItem>
        <TimelineItem time="08:30" avatar={system("AW")} icon={symbol(Invoice01Icon)}>
          Eine Rechnung wurde erstellt.
        </TimelineItem>
      </TimelineGroup>
    </Timeline>
  );
}

/** Pick 6: what stands in front of an entry. */
export const TimelineLead: Story = {
  render: () => (
    <div className="grid max-w-6xl grid-cols-3 gap-10">
      <Option name="Marken">
        <Recent lead="marks" />
      </Option>
      <Option name="Avatare">
        <Recent lead="avatars" />
      </Option>
      <Option name="Je nach Art" note="Vorschlag">
        <Recent lead="mixed" />
      </Option>
    </div>
  ),
};
