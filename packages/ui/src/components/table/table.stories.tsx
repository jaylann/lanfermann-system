import { Copy01Icon, Delete02Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { expect } from "storybook/test";

import { kindOf } from "@/components/attachment/kinds";
import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Card, CardBar } from "@/components/card/card";
import { FileKindSymbol } from "@/components/file-kind-symbol/file-kind-symbol";
import { ARRIVING, FILES } from "@/components/file-tile/story-files";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { Link } from "@/components/link/link";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/menu/menu";
import { MiddleTruncate } from "@/components/middle-truncate/middle-truncate";

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
        <MenuItem tone="danger">
          <Icon icon={Delete02Icon} />
          Löschen
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * In an app: the table straight in a `Card`, under a `CardBar` that names it. The card's edge
 * holds it: the column names on the well, the outer cells 20px in, no line under the last row.
 * The states are badges with a dot, quieter than the row.
 */
export const InCard: Story = {
  parameters: { visual: { target: '[data-slot="table-row"][data-interactive]' } },
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardBar>
        <Heading level={2} size="label" id="angebote-karte">
          Neueste Angebote
        </Heading>
        <Link href="#angebote" variant="quiet" className="text-sm text-fg-muted">
          Alle Angebote
        </Link>
      </CardBar>
      <Table aria-labelledby="angebote-karte">
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">Kunde</TableHead>
            <TableHead>Status</TableHead>
            <TableHead numeric>Betrag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {QUOTES.map((quote) => (
            <TableRow key={quote.id} interactive>
              <TableCell className="w-full max-w-0">
                <div className="flex min-w-0 flex-col">
                  <a
                    href={`#${quote.id}`}
                    className="truncate rounded-xs font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {quote.customer}
                  </a>
                  <span className="truncate text-sm text-fg-muted">
                    {quote.id} · {quote.subject}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge dot tone={quote.state[1]}>
                  {quote.state[0]}
                </Badge>
              </TableCell>
              <TableCell numeric>{euro.format(quote.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  ),
};

/**
 * Outside a card, in a reference or the docs: text, a status, an amount and an action per row.
 * The rule opens the table, hairlines divide the rows; amounts stand right in tabular digits
 * under a right-aligned heading.
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

function SortableQuotes({ links = false }: { links?: boolean }) {
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
  // As links, each heading leads to the order it would set; the story's router is this state.
  const sortProps = (key: SortKey) =>
    links
      ? {
          href: `?sort=${key}&dir=${directionOf(key) === "ascending" ? "desc" : "asc"}`,
          onClick: (event: MouseEvent) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey) return;
            event.preventDefault();
            toggle(key);
          },
        }
      : { onClick: () => toggle(key) };
  return (
    <Table aria-label="Angebote">
      <TableHeader>
        <TableRow>
          <TableHead sort={directionOf("customer") ?? "none"}>
            <TableSortButton direction={directionOf("customer")} {...sortProps("customer")}>
              Kunde
            </TableSortButton>
          </TableHead>
          <TableHead numeric sort={directionOf("amount") ?? "none"}>
            <TableSortButton direction={directionOf("amount")} {...sortProps("amount")}>
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

/**
 * Where the order is part of the address, the headings are links of the same look: a new tab
 * opens the list in that order, and the Back button undoes a sort.
 */
export const SortLinks: Story = {
  parameters: {
    visual: { viewport: { width: 520, height: 330 }, target: '[data-slot="table-sort-button"]' },
  },
  render: () => <SortableQuotes links />,
};

/** As a test: the headings are links that name where they lead, and a click still sorts. */
export const SortLinksKeyboard: Story = {
  render: () => <SortableQuotes links />,
  play: async ({ canvas, userEvent }) => {
    const customer = canvas.getByRole("link", { name: "Kunde" });
    await expect(customer).toHaveAttribute("href", "?sort=customer&dir=asc");
    await expect(canvas.getByRole("link", { name: "Betrag" })).toHaveAttribute(
      "href",
      "?sort=amount&dir=asc",
    );
    await userEvent.click(customer);
    await expect(canvas.getByRole("columnheader", { name: "Kunde" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(customer).toHaveAttribute("href", "?sort=customer&dir=desc");
  },
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

/** A table held to a phone's width, so it scrolls in any window. */
function NarrowQuotes() {
  return (
    <Table aria-label="Angebote" className="min-w-[36rem]" containerClassName="max-w-[22rem]">
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
  );
}

/**
 * On a phone the table keeps its columns and scrolls sideways inside its own region. `min-w-*`
 * on the table says how narrow the columns may get. The edge fades where more columns wait;
 * the rule above stays whole.
 */
export const Narrow: Story = {
  parameters: {
    // The region is the control: its focus ring is drawn around the rule and the mask.
    visual: { viewport: { width: 390, height: 330 }, target: '[data-slot="table-scroll"]' },
  },
  render: () => <NarrowQuotes />,
};

/**
 * Scrolls the table's region to the middle, as a reader would; again whenever the region changes
 * its size (the fonts arrive, the window turns narrow), so it stays in the middle.
 */
function ScrolledToMiddle({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const region = ref.current?.querySelector<HTMLElement>('[data-slot="table-scroll"]');
    if (!region) return;
    const observer = new ResizeObserver(() => {
      region.scrollLeft = (region.scrollWidth - region.clientWidth) / 2;
    });
    observer.observe(region);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref}>{children}</div>;
}

/** Scrolled to the middle, columns wait on both sides: both edges fade. */
export const Scrolled: Story = {
  parameters: { visual: { viewport: { width: 390, height: 330 } } },
  render: () => (
    <ScrolledToMiddle>
      <NarrowQuotes />
    </ScrolledToMiddle>
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

const LIST = FILES.slice(0, 6).sort((a, b) => a.name.localeCompare(b.name, "de"));

/** A folder's files as a list whose rows come and go: one is added, one is taken away. */
function ChangingFiles() {
  const [files, setFiles] = useState(LIST);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          data-step="add"
          onClick={() =>
            setFiles((all) =>
              all.some(({ id }) => id === ARRIVING.id)
                ? all
                : [...all, ARRIVING].sort((a, b) => a.name.localeCompare(b.name, "de")),
            )
          }
        >
          Hochladen
        </Button>
        <Button
          size="sm"
          variant="quiet"
          data-step="remove"
          onClick={() => setFiles((all) => all.filter(({ id }) => id !== "badge"))}
        >
          badge_neu.webp löschen
        </Button>
      </div>
      <Card>
        <CardBar>
          <Heading level={2} size="label" id="dateien-liste">
            Dateien
          </Heading>
        </CardBar>
        <Table aria-labelledby="dateien-liste">
          <TableHeader>
            <TableRow>
              <TableHead className="w-full">Name</TableHead>
              <TableHead numeric>Größe und Stand</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody live>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="w-full max-w-0">
                  <span className="flex min-w-0 items-center gap-2 font-medium text-fg">
                    <FileKindSymbol
                      kind={kindOf(file)}
                      size={14}
                      className="shrink-0 text-fg-muted"
                    />
                    <MiddleTruncate text={file.name} />
                  </span>
                </TableCell>
                <TableCell numeric>{file.meta}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/**
 * Rows that come and go while the table is read (`TableBody live`): what is there on load
 * stands still; a row that joins fades in at its place and the rows below glide down; one that
 * is taken away fades and the rows below glide up into its place.
 */
export const Live: Story = {
  parameters: {
    visual: {
      viewport: { width: 760, height: 520 },
      motion: [
        { name: "join", click: '[data-step="add"]', frames: 8 },
        { name: "leave", click: '[data-step="remove"]', frames: 10 },
      ],
    },
  },
  render: () => <ChangingFiles />,
};
