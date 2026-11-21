import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { BarChart } from "@/components/bar-chart/bar-chart";
import { BarList, type BarListItem } from "@/components/bar-list/bar-list";
import { Bullet } from "@/components/bullet/bullet";
import type { DateRange } from "@/components/calendar/calendar";
import { Card, CardBar } from "@/components/card/card";
import { DateRangeField } from "@/components/date-range-field/date-range-field";
import { lastDays } from "@/components/date-range-field/presets";
import { Dumbbell } from "@/components/dumbbell/dumbbell";
import { Funnel } from "@/components/funnel/funnel";
import { Heading } from "@/components/heading/heading";
import { Heatmap } from "@/components/heatmap/heatmap";
import { quoteDays } from "@/components/heatmap/story-data";
import { Link } from "@/components/link/link";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/components/page-header/page-header";
import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { SegmentedBar } from "@/components/segmented-bar/segmented-bar";
import { Sparkline } from "@/components/sparkline/sparkline";
import { Stat, StatChange, StatGroup, StatLabel, StatValue } from "@/components/stat/stat";
import { revenueDays, visitDays } from "@/components/time-series-chart/story-data";
import { TimeSeriesChart } from "@/components/time-series-chart/time-series-chart";
import { uptimeDays } from "@/components/tracker/story-data";
import { Tracker } from "@/components/tracker/tracker";
import { Waterfall } from "@/components/waterfall/waterfall";
import { pointLabel } from "@/internal/chart/time";
import { formatMoney, formatPercent, toTime } from "@/lib/format";

import { AppFrame } from "./app-frame";

/**
 * The „Auswertung“ page of the app frame: every chart in its place, to judge them together
 * (2026-11-21). A test page for the parts, not a template.
 */
const meta = {
  title: "Patterns/Analytics",
  parameters: {
    layout: "fullscreen",
    visual: {
      viewport: { width: 1180, height: 2300 },
      clip: "viewport",
      // The page's range: the sheet opens, „Letzte 7 Tage“ is pressed, and the chart re-forms.
      motion: [
        {
          name: "range",
          click: '[data-slot="date-range-field"] [data-slot="input-group-button"]',
          then: { click: '[data-slot="date-range-field-preset"]', at: 250 },
        },
      ],
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const euro = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;
const month = new Intl.DateTimeFormat("de-DE", { month: "short" });

/** The board's today: the sample series end here. */
const TODAY = "2026-11-20";
const lookBack = [lastDays(7), lastDays(28), lastDays(90)];
const DAY = 86_400_000;

const visits = visitDays();
const customers: BarListItem[] = [
  { name: "Gärtnerei Weiß", value: 18_640, href: "#weiss" },
  { name: "Schreinerei Mustermann", value: 14_280, href: "#mustermann" },
  { name: "Bäckerei Kornprobst", value: 11_920, href: "#kornprobst" },
  { name: "Elektro Wagner", value: 7_310, href: "#wagner" },
  { name: "Friseursalon Haarscharf", value: 3_950, href: "#haarscharf" },
];
const quotes = [
  { monat: "2026-06-01", erstellt: 18, angenommen: 11 },
  { monat: "2026-07-01", erstellt: 22, angenommen: 13 },
  { monat: "2026-08-01", erstellt: 15, angenommen: 9 },
  { monat: "2026-09-01", erstellt: 27, angenommen: 17 },
  { monat: "2026-10-01", erstellt: 31, angenommen: 21 },
  { monat: "2026-11-01", erstellt: 24, angenommen: 16 },
];

function Revenue({ range }: { range: DateRange }) {
  // The days of the range, up to the last one the series has.
  const count = Math.round((toTime(range.to) - toTime(range.from)) / DAY) + 1;
  const days = revenueDays(count, new Date(toTime(range.to)));
  const [active, setActive] = useState<(typeof days)[number] | null>(null);
  const total = days.reduce((sum, day) => sum + day.umsatz, 0);
  return (
    <Card>
      <CardBar>
        <Heading level={2} size="label">
          Umsatz
        </Heading>
      </CardBar>
      <div className="flex flex-col gap-5 px-5 pt-4 pb-5">
        <Stat>
          <StatLabel>
            {active
              ? pointLabel(toTime(active.tag), "day")
              : range.to === TODAY
                ? `In den letzten ${count} Tagen`
                : `An ${count} Tagen`}
          </StatLabel>
          <StatValue>
            <RollingNumber value={active ? active.umsatz : total} format={euro} />
          </StatValue>
        </Stat>
        <TimeSeriesChart
          label="Umsatz pro Tag"
          variant="area"
          data={days}
          x="tag"
          series={[{ key: "umsatz", label: "Umsatz" }]}
          format={euro}
          incomplete
          onActiveChange={(next) => setActive(next?.row ?? null)}
        />
      </div>
    </Card>
  );
}

function Analytics() {
  const [range, setRange] = useState(() => lastDays(28).range(TODAY));
  return (
    <AppFrame page="auswertung">
      <PageHeader>
        <PageHeaderTitle>Auswertung.</PageHeaderTitle>
        <PageHeaderDescription>
          Wie die Werkstatt im November läuft, mit den Wochen davor.
        </PageHeaderDescription>
        <PageHeaderActions>
          <DateRangeField
            aria-label="Zeitraum"
            value={range}
            // An emptied field keeps the page on the range it showed.
            onValueChange={(next) => next.from && setRange(next)}
            presets={lookBack}
            today={TODAY}
            max={TODAY}
            className="w-60"
          />
        </PageHeaderActions>
      </PageHeader>

      <Card>
        <StatGroup>
          <Stat>
            <StatLabel>Umsatz im November</StatLabel>
            <StatValue>{formatMoney(117_074, { maximumFractionDigits: 0 })}</StatValue>
            <StatChange trend="up" tone="positive" context="zum Vormonat">
              +18 %
            </StatChange>
            <Sparkline
              data={revenueDays().map((day) => day.umsatz)}
              variant="area"
              label="Umsatz der letzten 30 Tage, steigend"
            />
          </Stat>
          <Stat>
            <StatLabel>Besuche</StatLabel>
            <StatValue>48.212</StatValue>
            <StatChange trend="up" tone="positive" context="zum Vormonat">
              +6 %
            </StatChange>
            <Sparkline
              data={visits.map((day) => day.suche + day.direkt + day.empfehlung)}
              label="Besuche der letzten 30 Tage, leicht steigend"
            />
          </Stat>
          <Stat>
            <StatLabel>Angenommene Angebote</StatLabel>
            <StatValue>16</StatValue>
            <StatChange trend="down" tone="negative" context="zum Vormonat">
              −5
            </StatChange>
            <Sparkline
              data={quotes.map((row) => row.angenommen)}
              tone="muted"
              label="Angenommene Angebote der letzten sechs Monate"
            />
          </Stat>
        </StatGroup>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <Revenue range={range} />
        <Card>
          <CardBar>
            <Heading level={2} size="label">
              Umsatz nach Kunde
            </Heading>
            <Link href="#kunden" className="text-sm">
              Alle Kunden
            </Link>
          </CardBar>
          <div className="px-5 py-4">
            <BarList aria-label="Umsatz nach Kunde" data={customers} format={euro} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardBar>
            <Heading level={2} size="label">
              Angebote pro Monat
            </Heading>
          </CardBar>
          <div className="px-5 pt-4 pb-5">
            <BarChart
              label="Angebote pro Monat"
              height={200}
              data={quotes}
              x="monat"
              categoryLabel={(row) => month.format(toTime(row.monat))}
              series={[
                { key: "erstellt", label: "Erstellt" },
                { key: "angenommen", label: "Angenommen" },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardBar>
            <Heading level={2} size="label">
              Rechnungen im November
            </Heading>
            <span className="text-sm text-fg-muted tabular-nums">57.340 €</span>
          </CardBar>
          <div className="flex flex-col gap-6 px-5 pt-4 pb-5">
            <SegmentedBar
              label="Rechnungen nach Stand"
              size="tall"
              format={euro}
              data={[
                { name: "Bezahlt", value: 41_280 },
                { name: "Offen", value: 12_940 },
                { name: "Überfällig", value: 3_120 },
              ]}
            />
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-control font-medium text-fg">Angebotsdienst</p>
                <p className="text-sm text-fg-muted tabular-nums">
                  {formatPercent(0.998, { maximumFractionDigits: 1 })} verfügbar
                </p>
              </div>
              <Tracker
                label="Verfügbarkeit des Angebotsdienstes, letzte 90 Tage"
                data={uptimeDays()}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardBar>
            <Heading level={2} size="label">
              Vom Angebot zum Auftrag
            </Heading>
            <span className="text-sm text-fg-muted tabular-nums">31 % angenommen</span>
          </CardBar>
          <div className="px-5 py-4">
            <Funnel
              aria-label="Vom Angebot zum Auftrag im November"
              data={[
                { name: "Angebot erstellt", value: 124 },
                { name: "Angebot gesendet", value: 108 },
                { name: "Angebot angesehen", value: 71 },
                { name: "Angebot angenommen", value: 38 },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardBar>
            <Heading level={2} size="label">
              Ziele im November
            </Heading>
          </CardBar>
          <div className="px-5 py-4">
            <Bullet
              aria-label="Ziele im November"
              format={euro}
              data={[
                {
                  name: "Umsatz im November",
                  value: 117_074,
                  target: 110_000,
                  bands: [80_000, 100_000],
                },
                {
                  name: "Umsatz im Quartal",
                  value: 231_800,
                  target: 300_000,
                  bands: [200_000, 270_000],
                },
                {
                  name: "Abrechenbare Stunden",
                  value: 142,
                  target: 130,
                  bands: [100, 125],
                  format: { style: "unit", unit: "hour", unitDisplay: "short" },
                },
              ]}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardBar>
            <Heading level={2} size="label">
              Ergebnis im November
            </Heading>
          </CardBar>
          <div className="px-5 pt-4 pb-5">
            <Waterfall
              label="Ergebnis im November"
              height={200}
              format={euro}
              data={[
                { name: "Einnahmen", value: 48_200 },
                { name: "Material", value: -14_800 },
                { name: "Fremdleistung", value: -6_300 },
                { name: "Software", value: -1_240 },
                { name: "Ergebnis", value: 0, kind: "total" },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardBar>
            <Heading level={2} size="label">
              Stundensätze
            </Heading>
          </CardBar>
          <div className="px-5 pt-4 pb-5">
            <Dumbbell
              label="Stundensätze 2025 und 2026"
              labels={["2025", "2026"]}
              format={euro}
              data={[
                { name: "Beratung", from: 95, to: 105 },
                { name: "Umsetzung", from: 85, to: 92 },
                { name: "Wartung", from: 75, to: 75 },
                { name: "Schulung", from: 110, to: 118 },
                { name: "Notdienst", from: 140, to: 155 },
              ]}
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardBar>
          <Heading level={2} size="label">
            Angebote im Jahr
          </Heading>
          <span className="text-sm text-fg-muted tabular-nums">412 Angebote</span>
        </CardBar>
        <div className="px-5 pt-4 pb-5">
          <Heatmap
            label="Angebote pro Tag im letzten Jahr"
            data={quoteDays()}
            unit={{ one: "Angebot", other: "Angebote" }}
          />
        </div>
      </Card>
    </AppFrame>
  );
}

/** Every chart on the „Auswertung“ page, as an app would show them. */
export const Default: Story = {
  render: () => <Analytics />,
};

/** The same page on a phone: the cards stack, the year scrolls sideways from its newest week. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 4400 }, motion: [] } },
  render: () => <Analytics />,
};
