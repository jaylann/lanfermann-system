import {
  Cursor01Icon,
  Link01Icon,
  Mail01Icon,
  Megaphone01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";

import { Button } from "@/components/button/button";
import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";
import { Link } from "@/components/link/link";

import { BarList, type BarListItem } from "./bar-list";

const meta = {
  title: "Components/BarList",
  component: BarList,
  parameters: { layout: "padded", visual: { viewport: { width: 560, height: 360 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const euro = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;

const customers: BarListItem[] = [
  { name: "Gärtnerei Weiß", value: 18_640 },
  { name: "Schreinerei Mustermann", value: 14_280 },
  { name: "Bäckerei Kornprobst", value: 11_920 },
  { name: "Elektro Wagner", value: 7_310 },
  { name: "Friseursalon Haarscharf", value: 3_950 },
];

const sources: BarListItem[] = [
  { name: "Suche", value: 4_812, icon: Search01Icon, href: "#suche" },
  { name: "Direkt", value: 2_964, icon: Cursor01Icon, href: "#direkt" },
  { name: "Empfehlung", value: 1_377, icon: Link01Icon, href: "#empfehlung" },
  { name: "Newsletter", value: 902, icon: Mail01Icon, href: "#newsletter" },
  { name: "Werbung", value: 214, icon: Megaphone01Icon, href: "#werbung" },
];

/** Customers by revenue, largest first. */
export const Default: Story = {
  render: () => (
    <BarList
      className="w-[30rem] max-w-full"
      aria-label="Umsatz nach Kunde"
      data={customers}
      format={euro}
    />
  ),
};

/** Each row leads to its own page; a symbol says what kind of source it is. */
export const LinksAndIcons: Story = {
  name: "Links and icons",
  parameters: { visual: { target: '[data-slot="bar-list"] a' } },
  render: () => (
    <BarList className="w-[30rem] max-w-full" aria-label="Besuche nach Herkunft" data={sources} />
  ),
};

/** With each row's share of the whole beside its value. */
export const Shares: Story = {
  render: () => (
    <BarList
      className="w-[30rem] max-w-full"
      aria-label="Besuche nach Herkunft"
      data={sources}
      share
    />
  ),
};

/**
 * The three bars: a wash behind the name for the lists of an analytics page, a thin bar for a
 * compact list in a card, a `Meter`'s trough for parts of a whole.
 */
export const Variants: Story = {
  parameters: { visual: { viewport: { width: 1180, height: 400 } } },
  render: () => (
    <div className="grid w-[72rem] max-w-full grid-cols-1 gap-10 md:grid-cols-3">
      {(["wash", "thin", "trough"] as const).map((variant) => (
        <BarList
          key={variant}
          aria-label={`Umsatz nach Kunde (${variant})`}
          variant={variant}
          data={customers}
          format={euro}
          share={variant === "trough"}
        />
      ))}
    </div>
  ),
};

/** The first five of many, and a way to all of them, on a card as in an app. */
export const Limit: Story = {
  parameters: { visual: { viewport: { width: 560, height: 420 } } },
  render: () => (
    <Card className="w-[30rem] max-w-full">
      <CardBar>
        <Heading level={2} size="label">
          Umsatz nach Kunde
        </Heading>
        <Link href="#kunden" className="text-sm">
          Alle Kunden
        </Link>
      </CardBar>
      <div className="px-5 py-4">
        <BarList
          aria-label="Umsatz nach Kunde"
          data={[
            ...customers,
            { name: "Malerbetrieb Sommer", value: 2_140 },
            { name: "Café am Markt", value: 980 },
          ]}
          format={euro}
          limit={5}
        />
      </div>
    </Card>
  ),
};

/** A name too long for its row is cut with an ellipsis; the value always stands whole. */
export const LongNames: Story = {
  name: "Long names",
  render: () => (
    <BarList
      className="w-80"
      aria-label="Meistgeladene Dateien"
      data={[
        { name: "Auftragsbestätigung herunterladen", value: 1_284 },
        { name: "Angebot-Kornprobst-Backstube-Umbau-2026.pdf", value: 912 },
        { name: "Preisliste", value: 140 },
      ]}
    />
  ),
};

const weeks: BarListItem[][] = [
  customers,
  [
    { name: "Schreinerei Mustermann", value: 21_480 },
    { name: "Gärtnerei Weiß", value: 18_940 },
    { name: "Elektro Wagner", value: 12_310 },
    { name: "Bäckerei Kornprobst", value: 11_920 },
    { name: "Friseursalon Haarscharf", value: 4_150 },
  ],
];

/** When the ranking changes, the rows glide to their places and the bars to their lengths. */
export const Reorder: Story = {
  parameters: {
    visual: {
      viewport: { width: 560, height: 360 },
      motion: [{ name: "rerank", click: '[data-step="next"]' }],
    },
  },
  render: function Render() {
    const [week, setWeek] = useState(0);
    return (
      <div className="flex w-[30rem] max-w-full flex-col gap-5">
        <BarList aria-label="Umsatz nach Kunde" data={weeks[week]!} format={euro} />
        <Button
          variant="secondary"
          resize
          className="self-start"
          data-step="next"
          onClick={() => setWeek((week + 1) % weeks.length)}
        >
          {week === 0 ? "Dezember zeigen" : "November zeigen"}
        </Button>
      </div>
    );
  },
};

/** On a phone the values keep their room; names give way. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 360 }, motion: [] } },
  render: () => (
    <BarList className="w-full" aria-label="Besuche nach Herkunft" data={sources} share />
  ),
};

/** Rows that lead somewhere are links in reading order, each named by its words. */
export const Keyboard: Story = {
  render: () => (
    <BarList className="w-[30rem] max-w-full" aria-label="Besuche nach Herkunft" data={sources} />
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Suche 4.812" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Direkt 2.964" })).toHaveFocus();
    await expect(canvas.getByRole("list", { name: "Besuche nach Herkunft" })).toBeVisible();
  },
};
