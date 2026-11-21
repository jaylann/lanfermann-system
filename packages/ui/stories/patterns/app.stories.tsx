import {
  Add01Icon,
  Analytics01Icon,
  Calendar03Icon,
  Clock01Icon,
  Delete02Icon,
  Download01Icon,
  FilterIcon,
  Home01Icon,
  InboxIcon,
  Invoice01Icon,
  Layout01Icon,
  Logout01Icon,
  MoreHorizontalIcon,
  NoteEditIcon,
  PackageIcon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  UserIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type MouseEvent, useState } from "react";

import { ActionBar, ActionBarButton } from "@/components/action-bar/action-bar";
import {
  AppShell,
  AppShellBar,
  AppShellMain,
  AppShellPage,
} from "@/components/app-shell/app-shell";
import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { Badge } from "@/components/badge/badge";
import { BreadcrumbItem, BreadcrumbPage, Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs";
import { Button } from "@/components/button/button";
import { Card } from "@/components/card/card";
import { Checkbox } from "@/components/checkbox/checkbox";
import { Chip } from "@/components/chip/chip";
import { ChipGroup } from "@/components/chip/chip-group";
import {
  Command,
  CommandContent,
  CommandFooter,
  CommandInput,
  CommandList,
  type CommandSection,
  CommandTrigger,
} from "@/components/command/command";
import { Empty, EmptyActions, EmptyMedia, EmptyText, EmptyTitle } from "@/components/empty/empty";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLinkItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/menu/menu";
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/components/page-header/page-header";
import { Pagination } from "@/components/pagination/pagination";
import { Shortcut, ShortcutProvider } from "@/components/shortcut/shortcut";
import {
  Sidebar,
  SidebarButton,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMenu,
  SidebarTrigger,
} from "@/components/sidebar/sidebar";
import { Loaded } from "@/components/skeleton/loaded";
import { Skeleton, SkeletonGroup } from "@/components/skeleton/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";
import { Text } from "@/components/text/text";
import { toast, Toaster } from "@/components/toast/toast";
import { formatMoney } from "@/lib/format";

const meta = {
  title: "Patterns/App",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1180, height: 760 }, clip: "viewport" },
  },
  // The keys are drawn for one keyboard, so the pictures are the same on every machine.
  decorators: [
    (Story) => (
      <ShortcutProvider platform="apple">
        <Story />
      </ShortcutProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Place = { id: string; name: string; icon: IconSvgElement; detail?: string };

const first: Place[] = [
  { id: "uebersicht", name: "Übersicht", icon: Home01Icon },
  { id: "posteingang", name: "Posteingang", icon: InboxIcon, detail: "3" },
];
const work: Place[] = [
  { id: "angebote", name: "Angebote", icon: NoteEditIcon, detail: "12" },
  { id: "rechnungen", name: "Rechnungen", icon: Invoice01Icon },
  { id: "kunden", name: "Kunden", icon: UserMultipleIcon },
  { id: "termine", name: "Termine", icon: Calendar03Icon },
];
const more: Place[] = [
  { id: "vorlagen", name: "Vorlagen", icon: Layout01Icon },
  { id: "artikel", name: "Artikel", icon: PackageIcon },
  { id: "zeiterfassung", name: "Zeiterfassung", icon: Clock01Icon },
];
const office: Place[] = [
  { id: "auswertung", name: "Auswertung", icon: Analytics01Icon },
  { id: "einstellungen", name: "Einstellungen", icon: Settings01Icon },
];

const QUOTES = [
  ["2026-0421", "Schreinerei Mustermann", "Website und Google-Profil", 2780, "Entwurf", "neutral"],
  ["2026-0418", "Bäckerei Kornprobst", "Website, Bestellformular", 4280, "Gesendet", "info"],
  ["2026-0412", "Friseursalon Haarscharf", "Terminbuchung", 1950, "Gesendet", "info"],
  ["2026-0409", "Gärtnerei Weiß", "Website, Pflanzenkatalog", 5640, "Entwurf", "neutral"],
  ["2026-0397", "Elektro Wagner", "Website, monatliche Pflege", 3120, "Überfällig", "danger"],
  ["2026-0391", "Metzgerei Aigner", "Bestellformular", 1480, "Gesendet", "info"],
] as const;

type Quote = (typeof QUOTES)[number];

const PER_PAGE = QUOTES.length;
const TOTAL = 248;

const counted = (count: number) => (count === 1 ? "1 Angebot" : `${count} Angebote`);
const waiting = ["Über 1.000 €", "Mit Anhang"];

type BoardProps = {
  /** What the list holds when the story opens: its rows, nothing yet, or it is still loading. */
  state?: "list" | "empty" | "loading";
  /** The rows that are ticked when the story opens. */
  ticked?: readonly string[];
  /** A narrow window: fewer columns, the compact pages, the actions as symbols. */
  narrow?: boolean;
};

/**
 * The rows that are on their way, in the table they will stand in: the same head and the same
 * cells, with a shape where each value will be. So a row is as tall as it will be, and nothing
 * shifts when the list arrives.
 */
function RowsOnTheirWay({ narrow }: { narrow: boolean }) {
  return (
    <SkeletonGroup label="Die Angebote werden gerade geladen.">
      <Card>
        <Table aria-label="Angebote">
          <TableHeader>
            <TableRow>
              <TableHead className="w-0">
                {/* A column head has a name, also while its box is only a shape. */}
                <span className="sr-only">Auswahl</span>
                <Skeleton shape="block" className="size-(--check-size) rounded-xs" />
              </TableHead>
              <TableHead>Kunde</TableHead>
              {!narrow && <TableHead>Status</TableHead>}
              <TableHead numeric>Betrag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {["w-44", "w-36", "w-48", "w-40", "w-44", "w-32"].map((name, index) => (
              <TableRow key={index}>
                <TableCell className="w-0">
                  <Skeleton shape="block" className="size-(--check-size) rounded-xs" />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <Skeleton className={name} />
                    <Skeleton className="w-52 text-sm" />
                  </div>
                </TableCell>
                {!narrow && (
                  <TableCell>
                    <Skeleton shape="block" className="h-[1.375rem] w-20 rounded-sm" />
                  </TableCell>
                )}
                <TableCell numeric>
                  <Skeleton className="w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </SkeletonGroup>
  );
}

/**
 * One screen of an app, made from the parts: the shell with its sidebar and the palette, around
 * a list of quotes that can be filtered, ticked, paged, empty and loading. The story has no
 * router and no server: where one is, what is ticked and what was deleted is kept in state.
 */
function Board({ state = "list", ticked = [], narrow = false }: BoardProps) {
  const [at, setAt] = useState("angebote");
  const [rows, setRows] = useState<readonly Quote[]>(state === "empty" ? [] : QUOTES);
  const [selected, setSelected] = useState<readonly string[]>(ticked);
  const [filters, setFilters] = useState(["Offen", "Seit Oktober"]);
  const [page, setPage] = useState(1);

  const all = rows.length > 0 && selected.length === rows.length;
  const next = waiting.find((filter) => !filters.includes(filter));
  const toggle = (id: string) =>
    setSelected((now) => (now.includes(id) ? now.filter((each) => each !== id) : [...now, id]));
  const leads = (place: Place) => ({
    href: `#${place.id}`,
    current: at === place.id,
    onClick: (event: MouseEvent) => {
      event.preventDefault();
      setAt(place.id);
    },
  });

  const remove = () => {
    const kept = rows;
    const gone = selected.length;
    setRows(rows.filter(([id]) => !selected.includes(id)));
    setSelected([]);
    toast({
      title: `${counted(gone)} gelöscht.`,
      action: { label: "Rückgängig", onClick: () => setRows(kept) },
    });
  };

  const commands: CommandSection[] = [
    {
      value: "Vorschläge",
      items: [
        {
          value: "angebot-schreiben",
          label: "Angebot schreiben",
          icon: NoteEditIcon,
          shortcut: "mod+n",
          onSelect: () => toast({ title: "Ein neues Angebot ist angelegt." }),
        },
      ],
    },
    {
      value: "Seiten",
      items: [...first, ...work, ...more, ...office].map((place) => ({
        value: place.id,
        label: place.name,
        icon: place.icon,
        onSelect: () => setAt(place.id),
      })),
    },
  ];

  return (
    <AppShell>
      <Sidebar aria-label="Hauptnavigation">
        <SidebarHeader>
          <Menu>
            <MenuTrigger
              render={
                <SidebarButton
                  menu
                  media={
                    <Avatar size="sm">
                      <AvatarFallback>SH</AvatarFallback>
                    </Avatar>
                  }
                  className="font-medium text-fg"
                />
              }
            >
              Schreinerei Huber
            </MenuTrigger>
            <MenuContent className="min-w-56">
              <MenuItem>
                <Icon icon={Add01Icon} size={16} className="text-fg-muted" />
                Betrieb hinzufügen
              </MenuItem>
            </MenuContent>
          </Menu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            {first.map((place) => (
              <SidebarItem key={place.id} icon={place.icon} detail={place.detail} {...leads(place)}>
                {place.name}
              </SidebarItem>
            ))}
          </SidebarGroup>
          <SidebarGroup title="Arbeit">
            {work.map((place) => (
              <SidebarItem key={place.id} icon={place.icon} detail={place.detail} {...leads(place)}>
                {place.name}
              </SidebarItem>
            ))}
            <SidebarMenu
              icon={MoreHorizontalIcon}
              current={more.some((place) => place.id === at)}
              items={more.map((place) => (
                <MenuLinkItem
                  key={place.id}
                  href={`#${place.id}`}
                  closeOnClick
                  onClick={(event) => {
                    event.preventDefault();
                    setAt(place.id);
                  }}
                >
                  <Icon icon={place.icon} size={16} className="text-fg-muted" />
                  {place.name}
                </MenuLinkItem>
              ))}
            >
              Mehr
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup title="Verwaltung">
            {office.map((place) => (
              <SidebarItem
                key={place.id}
                icon={place.icon}
                iconMotion={place.id === "einstellungen" ? "turn" : undefined}
                {...leads(place)}
              >
                {place.name}
              </SidebarItem>
            ))}
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Menu>
            <MenuTrigger
              render={
                <SidebarButton
                  menu
                  media={
                    <Avatar size="sm">
                      <AvatarFallback>MH</AvatarFallback>
                    </Avatar>
                  }
                />
              }
            >
              Maria Huber
            </MenuTrigger>
            <MenuContent side="top" className="min-w-56">
              <MenuItem>
                <Icon icon={UserIcon} size={16} className="text-fg-muted" />
                Mein Profil
              </MenuItem>
              <MenuSeparator />
              <MenuItem>
                <Icon icon={Logout01Icon} size={16} className="text-fg-muted" />
                Abmelden
              </MenuItem>
            </MenuContent>
          </Menu>
        </SidebarFooter>
      </Sidebar>

      <AppShellPage>
        <AppShellBar>
          <SidebarTrigger />
          <Breadcrumbs label="Pfad">
            <BreadcrumbItem>
              <BreadcrumbPage>Angebote</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumbs>
          <Command items={commands} locale="de-DE">
            <CommandTrigger
              render={
                narrow ? (
                  <Button size="sm" iconOnly aria-label="Suchen" className="ml-auto" />
                ) : (
                  <Button size="sm" className="ml-auto w-52 justify-start text-fg-muted" />
                )
              }
            >
              <Icon icon={Search01Icon} size={14} />
              {!narrow && (
                <>
                  Suchen
                  <Shortcut keys="mod+k" className="ml-auto" />
                </>
              )}
            </CommandTrigger>
            <CommandContent>
              <CommandInput placeholder="z. B. Angebot schreiben" />
              <CommandList empty="Zu dieser Suche wurde kein Befehl gefunden." />
              <CommandFooter />
            </CommandContent>
          </Command>
        </AppShellBar>

        <AppShellMain className="flex flex-col gap-6">
          <PageHeader>
            <PageHeaderTitle>Angebote.</PageHeaderTitle>
            <PageHeaderDescription>
              Zwölf Angebote sind offen, drei davon laufen diese Woche ab.
            </PageHeaderDescription>
            <PageHeaderActions>
              <Button variant="primary">
                <Icon icon={Add01Icon} />
                Angebot schreiben
              </Button>
            </PageHeaderActions>
          </PageHeader>

          <div className="flex flex-wrap items-center gap-1.5">
            <ChipGroup aria-label="Filter">
              {filters.map((filter) => (
                <Chip
                  key={filter}
                  onRemove={() => setFilters((now) => now.filter((each) => each !== filter))}
                >
                  {filter}
                </Chip>
              ))}
            </ChipGroup>
            <Button
              size="sm"
              variant="quiet"
              disabled={!next}
              onClick={() => next && setFilters((now) => [...now, next])}
            >
              <Icon icon={FilterIcon} size={14} />
              Filter hinzufügen
            </Button>
          </div>

          <Loaded ready={state !== "loading"} skeleton={<RowsOnTheirWay narrow={narrow} />}>
            {rows.length === 0 ? (
              <Empty>
                <EmptyMedia>
                  <Icon icon={NoteEditIcon} size={20} />
                </EmptyMedia>
                <EmptyTitle>Sie haben noch kein Angebot geschrieben.</EmptyTitle>
                <EmptyText>
                  Sobald Sie ein Angebot geschrieben haben, erscheint es in dieser Liste.
                </EmptyText>
                <EmptyActions>
                  <Button variant="primary" onClick={() => setRows(QUOTES)}>
                    Erstes Angebot schreiben
                  </Button>
                </EmptyActions>
              </Empty>
            ) : (
              <div className="flex flex-col gap-4">
                <Card>
                  <Table aria-label="Angebote">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-0">
                          <Checkbox
                            aria-label="Alle Angebote auswählen"
                            checked={all}
                            indeterminate={selected.length > 0 && !all}
                            onCheckedChange={(checked) =>
                              setSelected(checked ? rows.map(([id]) => id) : [])
                            }
                          />
                        </TableHead>
                        <TableHead>Kunde</TableHead>
                        {!narrow && <TableHead>Status</TableHead>}
                        <TableHead numeric>Betrag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(([id, customer, subject, amount, status, tone]) => (
                        <TableRow key={id} selected={selected.includes(id)}>
                          <TableCell className="w-0">
                            <Checkbox
                              aria-label={`Angebot für ${customer} auswählen`}
                              checked={selected.includes(id)}
                              onCheckedChange={() => toggle(id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-medium text-fg">{customer}</span>
                              <span className="truncate text-sm text-fg-muted">{subject}</span>
                            </div>
                          </TableCell>
                          {!narrow && (
                            <TableCell>
                              <Badge dot tone={tone}>
                                {status}
                              </Badge>
                            </TableCell>
                          )}
                          <TableCell numeric>{formatMoney(amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <Text size="sm" tone="muted" numeric>
                    {(page - 1) * PER_PAGE + 1} bis {(page - 1) * PER_PAGE + rows.length} von{" "}
                    {TOTAL} Angeboten
                  </Text>
                  <Pagination
                    page={page}
                    pages={Math.ceil(TOTAL / PER_PAGE)}
                    variant={narrow ? "compact" : "numbered"}
                    href={(number) => `#seite-${number}`}
                    onPageChange={(number, event) => {
                      event.preventDefault();
                      setPage(number);
                    }}
                  />
                </div>
              </div>
            )}
          </Loaded>

          <ActionBar
            position="sticky"
            open={selected.length > 0}
            count={selected.length}
            onClear={() => setSelected([])}
          >
            {narrow ? (
              <>
                <ActionBarButton iconOnly aria-label="Senden">
                  <Icon icon={SentIcon} size={16} />
                </ActionBarButton>
                <ActionBarButton iconOnly aria-label="Als PDF herunterladen">
                  <Icon icon={Download01Icon} size={16} />
                </ActionBarButton>
                <ActionBarButton iconOnly aria-label="Löschen" onClick={remove}>
                  <Icon icon={Delete02Icon} size={16} />
                </ActionBarButton>
              </>
            ) : (
              <>
                <ActionBarButton
                  onClick={() => {
                    toast({ title: `${counted(selected.length)} gesendet.`, tone: "success" });
                    setSelected([]);
                  }}
                >
                  <Icon icon={SentIcon} size={14} />
                  Senden
                </ActionBarButton>
                <ActionBarButton
                  onClick={() =>
                    toast({ title: "PDF erstellt.", description: counted(selected.length) })
                  }
                >
                  <Icon icon={Download01Icon} size={14} />
                  Als PDF herunterladen
                </ActionBarButton>
                <ActionBarButton onClick={remove}>
                  <Icon icon={Delete02Icon} size={14} />
                  Löschen
                </ActionBarButton>
              </>
            )}
          </ActionBar>
        </AppShellMain>
      </AppShellPage>
      <Toaster />
    </AppShell>
  );
}

/**
 * The list as it is worked in. Tick a row: the bar rises under the list and counts. Take a
 * filter away, page on, collapse the sidebar (⌘B), open the palette (⌘K). A test board for the
 * parts together, not a template for a page.
 */
export const App: Story = {
  render: () => <Board />,
};

/** Three rows are ticked: the bar stands at the foot of the page, in the middle of the list. */
export const Selected: Story = {
  render: () => <Board ticked={["2026-0418", "2026-0412", "2026-0409"]} />,
};

/** Nothing has been written yet: what will stand here, and the first step. */
export const NothingYet: Story = {
  render: () => <Board state="empty" />,
};

/** The list is on its way: its shape stands in, and nothing shifts when the rows arrive. */
export const Loading: Story = {
  render: () => <Board state="loading" />,
};

/** On a phone: the sidebar is a drawer, the pages are compact, and the bar's actions are symbols. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 760 } } },
  render: () => <Board ticked={["2026-0418", "2026-0412"]} narrow />,
};
