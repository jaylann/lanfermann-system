import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card } from "@/components/card/card";
import { Stat, StatChange, StatGroup, StatLabel, StatValue } from "@/components/stat/stat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";
import {
  costServices,
  revenueDays,
  serviceCostDays,
  visitDays,
} from "@/components/time-series-chart/story-data";

import { Sparkline } from "./sparkline";

const meta = {
  title: "Components/Sparkline",
  component: Sparkline,
  parameters: { layout: "padded", visual: { viewport: { width: 560, height: 260 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const revenue = revenueDays().map((day) => day.umsatz);
const visits = visitDays();

/** The way a figure came, under it: on the dashboard's row of figures. */
export const InAStat: Story = {
  name: "In a stat",
  parameters: { visual: { viewport: { width: 980, height: 240 } } },
  render: () => (
    <Card className="w-[56rem] max-w-full">
      <StatGroup>
        <Stat>
          <StatLabel>Umsatz im November</StatLabel>
          <StatValue>117.074 €</StatValue>
          <StatChange trend="up" tone="positive" context="gegenüber dem Vormonat">
            +18 %
          </StatChange>
          <Sparkline data={revenue} variant="area" label="Umsatz der letzten 30 Tage, steigend" />
        </Stat>
        <Stat>
          <StatLabel>Besuche</StatLabel>
          <StatValue>48.212</StatValue>
          <StatChange trend="up" tone="positive" context="gegenüber dem Vormonat">
            +6 %
          </StatChange>
          <Sparkline
            data={visits.map((day) => day.suche + day.direkt + day.empfehlung)}
            label="Besuche der letzten 30 Tage, leicht steigend"
          />
        </Stat>
        <Stat>
          <StatLabel>Newsletter-Klicks</StatLabel>
          <StatValue>4.921</StatValue>
          <StatChange trend="flat" context="wie im Vormonat">
            ±0 %
          </StatChange>
          <Sparkline
            data={visits.map((day) => day.newsletter)}
            tone="muted"
            label="Newsletter-Klicks der letzten 30 Tage, gleichbleibend mit Spitzen am Dienstag"
          />
        </Stat>
      </StatGroup>
    </Card>
  ),
};

const pages = [
  { seite: "/angebote", aufrufe: 12_840, verlauf: visits.map((day) => day.suche) },
  { seite: "/preise", aufrufe: 6_212, verlauf: visits.map((day) => day.direkt) },
  { seite: "/kontakt", aufrufe: 2_904, verlauf: visits.map((day) => day.empfehlung) },
  {
    seite: "/blog/werkstatt-digital",
    aufrufe: 1_377,
    verlauf: visits.map((day) => day.newsletter),
  },
];

/** A trend per row, in a column of its own beside the figure. */
export const InATable: Story = {
  name: "In a table",
  parameters: { visual: { viewport: { width: 640, height: 300 } } },
  render: () => (
    <Table aria-label="Meistbesuchte Seiten" className="w-[36rem] max-w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Seite</TableHead>
          <TableHead numeric>Aufrufe</TableHead>
          <TableHead className="w-32">Letzte 30 Tage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((page) => (
          <TableRow key={page.seite}>
            <TableCell>{page.seite}</TableCell>
            <TableCell numeric>{page.aufrufe.toLocaleString("de-DE")}</TableCell>
            <TableCell>
              <Sparkline data={page.verlauf} height={20} end={false} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

const serviceDays = serviceCostDays(30);

/**
 * A trend in the colour of what it is about: each service's line wears the series colour its
 * bars and parts wear on the same page, the remainder the grey. `color` wins over `tone`.
 */
export const NamedColours: Story = {
  name: "Named colours",
  parameters: { visual: { viewport: { width: 640, height: 280 } } },
  render: () => (
    <Table aria-label="Kosten nach Dienst" className="w-[36rem] max-w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Dienst</TableHead>
          <TableHead numeric>November</TableHead>
          <TableHead className="w-40">Letzte 30 Tage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {costServices.map((service) => (
          <TableRow key={service.key}>
            <TableCell>{service.label}</TableCell>
            <TableCell numeric>
              {serviceDays
                .reduce((sum, day) => sum + day[service.key], 0)
                .toLocaleString("de-DE", { style: "currency", currency: "USD" })}
            </TableCell>
            <TableCell>
              <Sparkline
                data={serviceDays.map((day) => day[service.key])}
                color={service.color}
                variant="area"
                height={24}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/** The three tones, as a line and with its wash. */
export const Tones: Story = {
  parameters: { visual: { viewport: { width: 760, height: 220 } } },
  render: () => (
    <div className="grid w-[44rem] max-w-full grid-cols-3 gap-8">
      {(["neutral", "accent", "muted"] as const).map((tone) => (
        <div key={tone} className="flex flex-col gap-6">
          <Sparkline data={revenue} tone={tone} />
          <Sparkline data={revenue} tone={tone} variant="area" />
        </div>
      ))}
    </div>
  ),
};
