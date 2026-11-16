import { Copy01Icon, Delete02Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";

import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { Link } from "@/components/link/link";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/menu/menu";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableSortButton,
} from "./table";

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 330 } },
  },
} satisfies Meta;

export default meta;
// The table requires a name, which each story gives in its own markup: no shared `args`.
type Story = StoryObj;

const QUOTES = [
  {
    id: "2026-0421",
    customer: "Schreinerei Mustermann",
    subject: "Website und Google-Profil",
    amount: 2780,
    state: ["Entwurf", "neutral"],
  },
  {
    id: "2026-0418",
    customer: "Bäckerei Kornprobst",
    subject: "Website, Bestellformular",
    amount: 4280,
    state: ["Gesendet", "info"],
  },
  {
    id: "2026-0412",
    customer: "Friseursalon Haarscharf",
    subject: "Terminbuchung",
    amount: 1950,
    state: ["Angenommen", "success"],
  },
  {
    id: "2026-0397",
    customer: "Elektro Wagner",
    subject: "Website, monatliche Pflege",
    amount: 3120,
    state: ["Überfällig", "danger"],
  },
] as const;

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function RowActions({ id }: { id: string }) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button iconOnly size="sm" variant="quiet" aria-label={`Aktionen für Angebot ${id}`}>
            <Icon icon={MoreHorizontalIcon} size={14} />
          </Button>
        }
      />
      <MenuContent align="end">
        <MenuItem>
          <Icon icon={Copy01Icon} className="text-fg-muted" />
          Duplizieren
        </MenuItem>
        <MenuSeparator />
        <MenuItem className="text-danger">
          <Icon icon={Delete02Icon} />
          Löschen
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * Text, a status, an amount and an action per row. The rule opens the table, hairlines divide
 * the rows; amounts stand right in tabular digits under a right-aligned heading.
 */
export const Default: Story = {
  render: () => (
    <Table aria-label="Angebote">
      <TableHeader>
        <TableRow>
          <TableHead>Kunde</TableHead>
          <TableHead>Leistung</TableHead>
          <TableHead>Status</TableHead>
          <TableHead numeric>Betrag</TableHead>
          <TableHead>
            <span className="sr-only">Aktionen</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {QUOTES.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell className="font-medium text-fg">{quote.customer}</TableCell>
            <TableCell>{quote.subject}</TableCell>
            <TableCell>
              <Badge tone={quote.state[1]}>{quote.state[0]}</Badge>
            </TableCell>
            <TableCell numeric>{euro.format(quote.amount)}</TableCell>
            <TableCell className="w-0 py-0">
              <RowActions id={quote.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/**
 * Rows that open are washed under the pointer; the link in the row is what the keyboard uses.
 * A selected row is washed in the tint.
 */
export const Rows: Story = {
  parameters: { visual: { target: '[data-slot="table-row"][data-interactive]' } },
  render: () => (
    <Table aria-label="Angebote">
      <TableHeader>
        <TableRow>
          <TableHead>Kunde</TableHead>
          <TableHead>Nummer</TableHead>
          <TableHead numeric>Betrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {QUOTES.map((quote, index) => (
          <TableRow key={quote.id} interactive selected={index === 1}>
            <TableCell>
              <Link href={`#angebot-${quote.id}`} variant="quiet" className="font-medium text-fg">
                {quote.customer}
              </Link>
            </TableCell>
            <TableCell className="font-mono text-sm">{quote.id}</TableCell>
            <TableCell numeric>{euro.format(quote.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

type SortKey = "customer" | "amount";

function SortableQuotes() {
  const [sort, setSort] = useState<{ key: SortKey; direction: "ascending" | "descending" }>({
    key: "amount",
    direction: "descending",
  });
  const rows = [...QUOTES].sort((a, b) => {
    const order =
      sort.key === "amount" ? a.amount - b.amount : a.customer.localeCompare(b.customer, "de");
    return sort.direction === "ascending" ? order : -order;
  });
  const toggle = (key: SortKey) =>
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "ascending" ? "descending" : "ascending",
    }));
  const directionOf = (key: SortKey) => (sort.key === key ? sort.direction : undefined);
  return (
    <Table aria-label="Angebote">
      <TableHeader>
        <TableRow>
          <TableHead sort={directionOf("customer") ?? "none"}>
            <TableSortButton direction={directionOf("customer")} onClick={() => toggle("customer")}>
              Kunde
            </TableSortButton>
          </TableHead>
          <TableHead numeric sort={directionOf("amount") ?? "none"}>
            <TableSortButton direction={directionOf("amount")} onClick={() => toggle("amount")}>
              Betrag
            </TableSortButton>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell className="font-medium text-fg">{quote.customer}</TableCell>
            <TableCell numeric>{euro.format(quote.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * A sortable heading is a button with an arrow. The table keeps no state: the story sorts the
 * rows and tells the heading which way.
 */
export const Sortable: Story = {
  parameters: {
    visual: {
      viewport: { width: 520, height: 330 },
      target: '[data-slot="table-sort-button"]',
      motion: [
        { name: "turn", click: '[data-slot="table-sort-button"][data-direction]', frames: 6 },
      ],
    },
  },
  render: () => <SortableQuotes />,
};

const LINES = [
  { item: "Website, sechs Seiten", quantity: 1, unit: "pauschal", price: 2400 },
  { item: "Google-Unternehmensprofil", quantity: 1, unit: "pauschal", price: 380 },
  { item: "Pflege und Hosting", quantity: 12, unit: "Monate", price: 49 },
];

/** Invoice lines with a sum: the footer is set off by the structural line. */
export const WithFooter: Story = {
  parameters: { visual: { viewport: { width: 640, height: 330 } } },
  render: () => (
    <Table aria-label="Positionen">
      <TableCaption>Alle Beträge netto, zuzüglich 19 % Umsatzsteuer.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Position</TableHead>
          <TableHead numeric>Menge</TableHead>
          <TableHead numeric>Einzelpreis</TableHead>
          <TableHead numeric>Gesamt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {LINES.map((line) => (
          <TableRow key={line.item}>
            <TableCell className="text-fg">{line.item}</TableCell>
            <TableCell numeric>
              {line.quantity} <span className="text-fg-muted">{line.unit}</span>
            </TableCell>
            <TableCell numeric>{euro.format(line.price)}</TableCell>
            <TableCell numeric>{euro.format(line.quantity * line.price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Summe</TableCell>
          <TableCell numeric>
            {euro.format(LINES.reduce((sum, line) => sum + line.quantity * line.price, 0))}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

/**
 * On a phone the table keeps its columns and scrolls sideways inside its own region. `min-w-*`
 * on the table says how narrow the columns may get.
 */
export const Narrow: Story = {
  parameters: { visual: { viewport: { width: 390, height: 330 } } },
  render: () => (
    <Table aria-label="Angebote" className="min-w-[36rem]">
      <TableHeader>
        <TableRow>
          <TableHead>Kunde</TableHead>
          <TableHead>Leistung</TableHead>
          <TableHead numeric>Betrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {QUOTES.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell className="font-medium whitespace-nowrap text-fg">
              {quote.customer}
            </TableCell>
            <TableCell className="whitespace-nowrap">{quote.subject}</TableCell>
            <TableCell numeric>{euro.format(quote.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/**
 * As a test: the scrolling region is a named tab stop, and a sort button turns its column from
 * descending to ascending and tells assistive tech so.
 */
export const Keyboard: Story = {
  render: () => <SortableQuotes />,
  play: async ({ canvas, userEvent, step }) => {
    const region = canvas.getByRole("region", { name: "Angebote" });
    const amount = canvas.getByRole("columnheader", { name: "Betrag" });
    const firstCustomer = () => canvas.getAllByRole("row")[1]!;

    await step("The region is the first tab stop, then the sort buttons", async () => {
      await userEvent.tab();
      await expect(region).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Kunde" })).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Betrag" })).toHaveFocus();
    });

    await step("It starts sorted by amount, largest first", async () => {
      await expect(amount).toHaveAttribute("aria-sort", "descending");
      await expect(firstCustomer()).toHaveTextContent("Bäckerei Kornprobst");
    });

    await step("Enter turns the order around", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(amount).toHaveAttribute("aria-sort", "ascending");
      await expect(firstCustomer()).toHaveTextContent("Friseursalon Haarscharf");
    });
  },
};

const MODES = [
  {
    topic: "Wer das sevDesk-Token hält",
    bearer: "der Server",
    oauth: "der Client jedes Benutzers, verschlüsselt in den Tokens, die der Server ausstellt",
  },
  { topic: "Konten", bearer: "eines", oauth: "jedes Konto, das der Server freigibt" },
  {
    topic: "Zugriff entziehen",
    bearer: "das Geheimnis ändern",
    oauth: "je Verbindung, je Konto oder alles auf einmal",
  },
];

function Modes() {
  return (
    <Table aria-label="Bearer oder OAuth" content="text" stack>
      <TableHeader>
        <TableRow>
          <TableHead>
            <span className="sr-only">Frage</span>
          </TableHead>
          <TableHead>bearer</TableHead>
          <TableHead>oauth</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MODES.map((row) => (
          <TableRow key={row.topic}>
            <TableCell className="font-medium text-fg">{row.topic}</TableCell>
            <TableCell label="bearer">{row.bearer}</TableCell>
            <TableCell label="oauth">{row.oauth}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * A table of sentences (`content="text"`): every cell starts at the top of its row, so a short
 * answer stands beside the first line of a long one.
 */
export const Text: Story = {
  render: () => <Modes />,
  parameters: { visual: { viewport: { width: 760, height: 330 } } },
};

/**
 * The same table on a phone (`stack`): each row is a block under its first cell, and every
 * other cell is named by its column. It stays a table to assistive tech.
 */
export const Stacked: Story = {
  render: () => <Modes />,
  parameters: { visual: { viewport: { width: 390, height: 600 } } },
};
