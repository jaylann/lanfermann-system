import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect, useState } from "react";
import { expect, waitFor } from "storybook/test";

import {
  AppShell,
  AppShellBar,
  AppShellMain,
  AppShellPage,
} from "@/components/app-shell/app-shell";
import { Badge } from "@/components/badge/badge";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  Breadcrumbs,
} from "@/components/breadcrumbs/breadcrumbs";
import { Card, CardContent } from "@/components/card/card";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list/description-list";
import { FileGrid, FileGridSection } from "@/components/file-grid/file-grid";
import { FileTile } from "@/components/file-tile/file-tile";
import { FILES } from "@/components/file-tile/story-files";
import { Heading } from "@/components/heading/heading";
import { Link } from "@/components/link/link";
import { PageHeader, PageHeaderTitle } from "@/components/page-header/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";
import { Text } from "@/components/text/text";
import { Timeline, TimelineItem } from "@/components/timeline/timeline";

import { DetailPane, DetailPaneLayout, StickyDetailPane } from "./detail-pane";

const meta = {
  title: "Components/DetailPane",
  component: DetailPaneLayout,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 1100, height: 520 },
      motion: [{ name: "open", click: '[data-slot="file-tile"]', frames: 10 }],
    },
  },
} satisfies Meta<typeof DetailPaneLayout>;

export default meta;
type Story = StoryObj;

/** A folder of files: a press on a tile chooses it and opens the pane, a second press closes it. */
function Folder({ initial }: { initial?: string }) {
  const [chosen, setChosen] = useState<string | undefined>(initial);
  const file = FILES.find((entry) => entry.id === chosen);
  return (
    <DetailPaneLayout open={file !== undefined}>
      <Card>
        <CardContent>
          <FileGrid aria-label="Dateien in kunden/huber">
            <FileGridSection>
              {FILES.slice(0, 6).map(({ id, ...entry }) => (
                <FileTile
                  key={id}
                  {...entry}
                  selected={chosen === id}
                  onClick={() => setChosen(chosen === id ? undefined : id)}
                />
              ))}
            </FileGridSection>
          </FileGrid>
        </CardContent>
      </Card>
      <DetailPane aria-label="Details">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <Heading level={2} size="sub" className="break-words">
              {file?.name}
            </Heading>
            <Text size="sm">Geändert am 31. März, 2 KB.</Text>
          </CardContent>
        </Card>
      </DetailPane>
    </DetailPaneLayout>
  );
}

/** Nothing chosen: the folder has the whole width. Press a tile to open the pane. */
export const Closed: Story = { render: () => <Folder /> };

/** One file chosen: the pane stands beside the folder, which is narrower by it. */
export const Open: Story = { render: () => <Folder initial={FILES[1]!.id} /> };

/** The pane opens with a choice and closes with the last one taken back, out of reach then. */
export const Choosing: Story = {
  render: () => <Folder />,
  play: async ({ canvasElement, userEvent }) => {
    const pane = canvasElement.querySelector<HTMLElement>('[data-slot="detail-pane"]');
    const tile = canvasElement.querySelector<HTMLElement>('[data-slot="file-tile"]');
    if (!pane || !tile) throw new Error("the story has no pane or no tile");
    await expect(pane).toHaveAttribute("inert");
    await userEvent.click(tile);
    await waitFor(() => expect(pane).not.toHaveAttribute("inert"));
    await expect(pane).toHaveTextContent(FILES[0]!.name);
    await userEvent.click(tile);
    await waitFor(() => expect(pane).toHaveAttribute("inert"));
    // While it leaves it still shows what it showed.
    await expect(pane).toHaveTextContent(FILES[0]!.name);
  },
};

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

type Invoice = {
  id: string;
  customer: string;
  place: string;
  amount: number;
  due: string;
  state: "Offen" | "Bezahlt" | "Überfällig";
};

const CUSTOMERS = [
  ["Schreinerei Huber", "Rosenheim"],
  ["Bäckerei Kornprobst", "Bad Aibling"],
  ["Friseursalon Haarscharf", "München"],
  ["Brauerei Giesinger Hof", "München"],
  ["Metzgerei Obermaier", "Wasserburg"],
  ["Blumen Seidl", "Prien"],
  ["Café Fräulein Grüneis", "München"],
  ["Zimmerei Lechner", "Traunstein"],
  ["Optik Sonnleitner", "Rosenheim"],
  ["Elektro Wagner", "Kolbermoor"],
  ["Gärtnerei Weiß", "Bruckmühl"],
  ["Malerbetrieb Stadler", "Rosenheim"],
] as const;
const AMOUNTS = [2380, 4165, 892.5, 6902, 1547, 714, 3094, 5236, 1309, 3120, 860, 2779];
const STATES: Invoice["state"][] = [
  "Offen",
  "Bezahlt",
  "Bezahlt",
  "Überfällig",
  "Offen",
  "Bezahlt",
];

/** Two dozen invoices, newest first: enough rows for the page to scroll under the pane. */
const INVOICES: Invoice[] = Array.from({ length: 24 }, (_, index) => {
  const [customer, place] = CUSTOMERS[index % CUSTOMERS.length]!;
  return {
    id: `RE-2026-${118 - index}`,
    customer,
    place,
    amount: AMOUNTS[(index * 5) % AMOUNTS.length]!,
    due: `${28 - index} . November 2026`.replace(" .", "."),
    state: STATES[index % STATES.length]!,
  };
});

const toneOf = { Offen: "info", Bezahlt: "success", Überfällig: "danger" } as const;

/** Scrolls the page once it is laid out, so a still shows the pane as it stands while stuck. */
function PageScrolled({ by, children }: { by: number; children: ReactNode }) {
  useEffect(() => {
    // The place must not depend on when the web font arrives: without anchoring, a late font
    // cannot move the page by a pixel after it was scrolled.
    document.documentElement.style.overflowAnchor = "none";
    const observer = new ResizeObserver(() => window.scrollTo({ top: by }));
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      document.documentElement.style.overflowAnchor = "";
      window.scrollTo({ top: 0 });
    };
  }, [by]);
  return children;
}

/**
 * The invoices of a workshop inside an app's shell: a press on a row opens its details in the
 * pane, which stays under the bar while the list scrolls on.
 */
function Invoices({ initial, history = false }: { initial?: string; history?: boolean }) {
  const [chosen, setChosen] = useState<string | undefined>(initial);
  const invoice = INVOICES.find((entry) => entry.id === chosen);
  return (
    <AppShell>
      <AppShellPage>
        <AppShellBar>
          <Breadcrumbs>
            <BreadcrumbItem>
              <BreadcrumbLink href="#uebersicht">Schreinerei Huber</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Rechnungen</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumbs>
        </AppShellBar>
        <AppShellMain className="flex flex-col gap-6">
          <PageHeader>
            <PageHeaderTitle>Rechnungen.</PageHeaderTitle>
          </PageHeader>
          <DetailPaneLayout open={invoice !== undefined}>
            <Card>
              <Table aria-label="Rechnungen">
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Stand</TableHead>
                    <TableHead numeric>Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INVOICES.map((entry) => (
                    <TableRow key={entry.id} selected={entry.id === chosen}>
                      <TableCell>
                        <Link
                          href={`#${entry.id}`}
                          variant="quiet"
                          className="font-medium text-fg"
                          onClick={(event) => {
                            event.preventDefault();
                            setChosen(entry.id === chosen ? undefined : entry.id);
                          }}
                        >
                          {entry.customer}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{entry.id}</TableCell>
                      <TableCell>
                        <Badge tone={toneOf[entry.state]}>{entry.state}</Badge>
                      </TableCell>
                      <TableCell numeric>{euro.format(entry.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <StickyDetailPane label="Rechnung" scrollKey={invoice?.id}>
              {invoice && (
                <CardContent className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <Text size="sm" tone="muted" mono>
                      {invoice.id}
                    </Text>
                    <Heading level={2} size="sub">
                      {invoice.customer}
                    </Heading>
                  </div>
                  <DescriptionList>
                    <DescriptionTerm>Betrag</DescriptionTerm>
                    <DescriptionDetails>{euro.format(invoice.amount)}</DescriptionDetails>
                    <DescriptionTerm>Fällig am</DescriptionTerm>
                    <DescriptionDetails>{invoice.due}</DescriptionDetails>
                    <DescriptionTerm>Stand</DescriptionTerm>
                    <DescriptionDetails>
                      <Badge tone={toneOf[invoice.state]}>{invoice.state}</Badge>
                    </DescriptionDetails>
                    <DescriptionTerm>Ort</DescriptionTerm>
                    <DescriptionDetails>{invoice.place}</DescriptionDetails>
                  </DescriptionList>
                  {history && (
                    <div className="flex flex-col gap-3">
                      <Heading level={3} size="label">
                        Verlauf
                      </Heading>
                      <Timeline>
                        <TimelineItem time="Heute, 9:12">
                          Zweite Mahnung per E-Mail versendet.
                        </TimelineItem>
                        <TimelineItem time="21. Nov.">
                          <strong>Maria Huber</strong> hat die Zahlungsfrist um sieben Tage
                          verlängert.
                        </TimelineItem>
                        <TimelineItem time="14. Nov.">
                          Erste Mahnung per E-Mail versendet.
                        </TimelineItem>
                        <TimelineItem time="7. Nov.">Zahlungsfrist abgelaufen.</TimelineItem>
                        <TimelineItem time="24. Okt.">Rechnung vom Kunden geöffnet.</TimelineItem>
                        <TimelineItem time="24. Okt.">
                          <strong>Maria Huber</strong> hat die Rechnung versendet.
                        </TimelineItem>
                        <TimelineItem time="23. Okt.">
                          Rechnung aus dem Angebot A-2026-0397 erstellt.
                        </TimelineItem>
                      </Timeline>
                    </div>
                  )}
                </CardContent>
              )}
            </StickyDetailPane>
          </DetailPaneLayout>
        </AppShellMain>
      </AppShellPage>
    </AppShell>
  );
}

const stickyParameters = {
  layout: "fullscreen",
  visual: { viewport: { width: 1200, height: 700 }, clip: "viewport", motion: [] },
} as const;

/**
 * `StickyDetailPane` in an app's shell: the list is longer than the window, and the pane's card
 * stands beside its first rows.
 */
export const Sticky: Story = {
  parameters: stickyParameters,
  render: () => <Invoices initial="RE-2026-116" />,
};

/** The page has scrolled on: the card stays under the bar, as far from it as from the list. */
export const StickyScrolled: Story = {
  parameters: stickyParameters,
  render: () => (
    <PageScrolled by={520}>
      <Invoices initial="RE-2026-105" />
    </PageScrolled>
  ),
};

/**
 * More in the pane than the window is tall: stuck, the card ends above the window's foot, what
 * it holds scrolls inside it, and the edge where more waits fades.
 */
export const StickyTall: Story = {
  parameters: {
    ...stickyParameters,
    visual: { ...stickyParameters.visual, viewport: { width: 1200, height: 560 } },
  },
  render: () => (
    <PageScrolled by={260}>
      <Invoices initial="RE-2026-109" history />
    </PageScrolled>
  ),
};

/**
 * As a test: scrolled, the card stands under the bar and ends above the window's foot; it
 * scrolls inside itself, and with another row chosen it starts at its top again.
 */
export const StickyStays: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <Invoices initial="RE-2026-115" history />,
  play: async ({ canvasElement, userEvent, step }) => {
    const find = (slot: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
    const card = () => find("detail-pane").querySelector<HTMLElement>('[data-slot="card"]')!;
    const scroller = find("detail-pane-scroll");

    await step("scrolled, the card stands 24px under the bar", async () => {
      window.scrollTo({ top: 480 });
      await waitFor(async () => {
        const bar = find("app-shell-bar").getBoundingClientRect();
        await expect(Math.round(card().getBoundingClientRect().top - bar.bottom)).toBe(24);
      });
    });

    await step("it ends above the window's foot and scrolls inside itself", async () => {
      await expect(card().getBoundingClientRect().bottom).toBeLessThanOrEqual(
        window.innerHeight - 24,
      );
      scroller.scrollTo({ top: 80 });
      await waitFor(() => expect(scroller.scrollTop).toBe(80));
    });

    await step("another row starts the pane at its top again", async () => {
      const other = canvasElement.querySelector<HTMLElement>('a[href="#RE-2026-110"]')!;
      await userEvent.click(other);
      await waitFor(() => expect(scroller.scrollTop).toBe(0));
      window.scrollTo({ top: 0 });
    });
  },
};
