import { Invoice01Icon, Mail01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { AvatarGroup } from "@/components/avatar-group/avatar-group";
import type { AvatarPerson } from "@/components/avatar-group/people";
import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Checkbox } from "@/components/checkbox/checkbox";
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
  type TableLook,
  TableRow,
} from "@/components/table/table";
import { Text } from "@/components/text/text";
import { Timeline, TimelineGroup, TimelineItem } from "@/components/timeline/timeline";
import { cn } from "@/lib/cn";

import { AppFrame } from "../patterns/app-frame";

/**
 * The refinement of the record list, second round. Justin picked „Straff“ from the first
 * (2026-11-19) but not the whole: "I dont like the overall layout and feeling. Also with the black
 * bar at the top." So „Straff“ stands here as the reference, and three directions keep its
 * spacing and centring but hold the table differently, without the 2px rule: on a card, bare
 * under its heading, or under a rounded band. Each is shown in the dashboard it lives in, and
 * then in the app's list, a run of selected rows and the two columns with avatars.
 *
 * The control „Stand“ puts every direction on the same status, to judge the layout apart from
 * it. A lab board is not part of the library: it goes when the pick is made.
 */
const meta = {
  title: "Lab/Table 2026-11-19",
  tags: ["visual-skip"],
  parameters: { layout: "padded", visual: { viewport: { width: 1290, height: 1000 } } },
  argTypes: {
    stand: {
      name: "Stand",
      control: "select",
      options: ["je Richtung", "farbe", "etikett", "punkt"],
      description:
        "Wie der Stand eines Angebots steht: als farbiges Etikett, als neutrales Etikett mit Punkt, oder als Punkt und Wort.",
    },
  },
  args: { stand: "je Richtung" },
} satisfies Meta<{ stand: string }>;

export default meta;
type Story = StoryObj<{ stand: string }>;

/** How a quote's state is shown: the tone's `Badge`, a neutral one with a dot, or a dot alone. */
type StateStyle = "farbe" | "etikett" | "punkt";

type Direction = {
  name: string;
  note: string;
  look: TableLook;
  state: StateStyle;
  /** How the figures above stand: under their rule, on cards, bare, or on one plate. */
  figures: "ruled" | "cards" | "bare" | "plate";
  /** Whether each block is a card, with its heading in the card's head. */
  card: boolean;
  /** A link to the whole list beside the heading. */
  more: boolean;
  proposal?: boolean;
};

const TIGHT: Direction = {
  name: "Straff",
  note: "die Wahl der ersten Runde: unter der 2px-Linie, farbige Etiketten",
  look: "tight",
  state: "farbe",
  figures: "ruled",
  card: false,
  more: false,
};
const CARD: Direction = {
  name: "Karte",
  note: "auf Karten, die Überschrift im Kopf, die Spaltennamen auf einem leisen Band",
  look: "card",
  state: "etikett",
  figures: "cards",
  card: true,
  more: true,
  proposal: true,
};
const OPEN: Direction = {
  name: "Offen",
  note: "auf dem Grund, ohne Linie darüber: die Überschrift öffnet, Haarlinien in der Spalte",
  look: "open",
  state: "punkt",
  figures: "bare",
  card: false,
  more: true,
};
const BAND: Direction = {
  name: "Leiste",
  note: "auf dem Grund, die Spaltennamen in einem runden Band, Zeilen ohne Linien",
  look: "band",
  state: "punkt",
  figures: "plate",
  card: false,
  more: true,
};
const DIRECTIONS = [TIGHT, CARD, OPEN, BAND];

const styleOf = (direction: Direction, stand: string): StateStyle =>
  stand === "farbe" || stand === "etikett" || stand === "punkt" ? stand : direction.state;

/** What a direction is, above what it looks like (on the boards with all four side by side). */
function Option({ direction, children }: { direction: Direction; children: ReactNode }) {
  return (
    <section aria-label={direction.name} className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col text-sm">
        <p className="flex items-baseline gap-2">
          <span className="font-semibold text-fg">{direction.name}</span>
          {direction.proposal && <span className="font-medium text-accent">Vorschlag</span>}
        </p>
        <p className="text-fg-muted">{direction.note}</p>
      </div>
      {children}
    </section>
  );
}

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const dot: Record<Tone, string> = {
  // A draft is a ring: open, not yet anything.
  neutral: "border-[1.5px] border-fg-muted",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

function Dot({ tone }: { tone: Tone }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot[tone])} />;
}

/**
 * A quote's state. `farbe` is today's `Badge` in its tone; `etikett` a neutral badge whose dot
 * carries the hue; `punkt` the dot and the word in the row's text colour. The word always says
 * it. The last two are lab only; one would become a `Badge` variant if chosen.
 */
function State({ style, tone, children }: { style: StateStyle; tone: Tone; children: string }) {
  if (style === "farbe") return <Badge tone={tone}>{children}</Badge>;
  if (style === "etikett")
    return (
      <Badge className="gap-1.5 pl-1.5">
        <Dot tone={tone} />
        {children}
      </Badge>
    );
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Dot tone={tone} />
      {children}
    </span>
  );
}

/**
 * A block of the page with its heading: on a card, with the heading in the card's head, or on
 * the ground under it. A table is a region of its own, named by the heading, so its block is a
 * plain box; other blocks are sections.
 */
function Block({
  direction,
  id,
  title,
  more,
  section = false,
  className,
  children,
}: {
  direction: Direction;
  id: string;
  title: string;
  more?: ReactNode;
  section?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const Box = section ? "section" : "div";
  const heading = (
    <Heading level={2} size="label" id={id}>
      {title}
    </Heading>
  );
  if (direction.card) {
    return (
      <Box
        aria-labelledby={section ? id : undefined}
        className={cn("flex min-w-0 flex-col rounded-xl bg-surface depth-card", className)}
      >
        <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-hairline px-5">
          {heading}
          {more}
        </div>
        {children}
      </Box>
    );
  }
  return (
    <Box
      aria-labelledby={section ? id : undefined}
      className={cn("flex min-w-0 flex-col gap-3", className)}
    >
      <div className="flex items-baseline justify-between gap-4">
        {heading}
        {more}
      </div>
      {children}
    </Box>
  );
}

/** Where the whole list is. Quiet: the rows are what is read. */
function More({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} variant="quiet" className="text-sm text-fg-muted">
      {children}
    </Link>
  );
}

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

/**
 * The record's name over what it is about. With `href`, the name is the row's link. A `state`
 * leads the second line on a phone, where its own column gives way to the name.
 */
function Entry({
  name,
  detail,
  href,
  state,
}: {
  name: string;
  detail: string;
  href?: string;
  state?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      {href ? (
        <a
          href={href}
          className="truncate rounded-xs font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {name}
        </a>
      ) : (
        <span className="truncate font-medium text-fg">{name}</span>
      )}
      <span className="truncate text-sm text-fg-muted">
        {state && <span className="mr-2 sm:hidden">{state}</span>}
        {detail}
      </span>
    </div>
  );
}

// --- the dashboard ----------------------------------------------------------------------------

const LATEST = [
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

function Figures({ direction, accepted }: { direction: Direction; accepted: number }) {
  const revenue = 12_480 + accepted * 4_280;
  return (
    <StatGroup
      variant={direction.figures === "cards" ? "cards" : "ruled"}
      // Lab only: what the figures would do without the rule. Bare, they keep their dividers
      // and reach past the column by their padding, so their text stands on its edge as the
      // table's does; on a plate, they stand on the quiet surface in one rounded band that
      // reaches 12px past the column, as the band of column names does.
      className={cn(
        (direction.figures === "bare" || direction.figures === "plate") &&
          "border-t-0 before:hidden",
        direction.figures === "bare" && "-mx-5 max-sm:-mx-4",
        direction.figures === "plate" &&
          "-mx-3 rounded-lg bg-surface-quiet [&_[data-slot=stat]]:px-3",
      )}
    >
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
}

/**
 * `Patterns/Dashboard` in one direction: the figures, the latest quotes and what happened lately,
 * in the app's frame. „Aktualisieren“ brings in an accepted quote, as there.
 */
function Dashboard({ direction, stand }: { direction: Direction; stand: string }) {
  const [accepted, setAccepted] = useState(0);
  const style = styleOf(direction, stand);
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

      <Figures direction={direction} accepted={accepted} />

      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]",
          direction.card ? "items-start gap-6" : "gap-x-10 gap-y-8",
        )}
      >
        <Block
          direction={direction}
          id="neueste"
          title="Neueste Angebote"
          more={direction.more && <More href="#angebote">Alle Angebote</More>}
        >
          <Table aria-labelledby="neueste" look={direction.look}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-full">Kunde</TableHead>
                <TableHead className="max-sm:hidden">Stand</TableHead>
                <TableHead numeric>Betrag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LATEST.map(([id, customer, subject, amount, status, tone]) => {
                const now = accepted && id === "A-2026-0418";
                const state = (
                  <State style={style} tone={now ? "success" : tone}>
                    {now ? "Angenommen" : status}
                  </State>
                );
                return (
                  <TableRow key={id} interactive>
                    <TableCell className="w-full max-w-0">
                      <Entry
                        name={customer}
                        detail={`${id} · ${subject}`}
                        href={`#angebot-${id}`}
                        state={
                          <State style="punkt" tone={now ? "success" : tone}>
                            {now ? "Angenommen" : status}
                          </State>
                        }
                      />
                    </TableCell>
                    <TableCell className="max-sm:hidden">{state}</TableCell>
                    <TableCell numeric>{euro.format(amount)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Block>

        <Block direction={direction} id="zuletzt" title="Zuletzt" section>
          <div className={cn(direction.card && "px-5 pt-4 pb-5")}>
            <Timeline>
              <TimelineGroup label="Heute" dateTime="2026-11-19">
                {accepted > 0 && (
                  <TimelineItem time="15:02" avatar={<Person initials="BK" />}>
                    <strong>Bäckerei Kornprobst</strong> hat das Angebot <Whole>A-2026-0418</Whole>{" "}
                    angenommen.
                  </TimelineItem>
                )}
                <TimelineItem time="14:32" avatar={<Person initials="FH" />}>
                  <strong>Friseursalon Haarscharf</strong> hat das Angebot{" "}
                  <Whole>A-2026-0412</Whole> angenommen.
                </TimelineItem>
                <TimelineItem time="11:05" icon={Mail01Icon}>
                  Das Angebot <Whole>A-2026-0418</Whole> wurde versendet.
                </TimelineItem>
              </TimelineGroup>
              <TimelineGroup label="Gestern" dateTime="2026-11-18">
                <TimelineItem time="16:20" icon={Invoice01Icon}>
                  Die Rechnung <Whole>R-2026-0112</Whole> über <Whole>1.240,00 €</Whole> ist
                  bezahlt.
                </TimelineItem>
                <TimelineItem time="08:30" avatar={<Person initials="JK" />}>
                  <strong>Jonas Klein</strong> hat das Angebot <Whole>A-2026-0421</Whole> angelegt.
                </TimelineItem>
              </TimelineGroup>
            </Timeline>
          </div>
        </Block>
      </div>
    </AppFrame>
  );
}

const page = {
  layout: "fullscreen",
  visual: {
    viewport: { width: 1290, height: 1000 },
    clip: "viewport",
    target: '[data-slot="table-row"][data-interactive]',
  },
} as const;

/** The reference: „Straff“ as Justin saw it, in the dashboard. */
export const Straff: Story = {
  parameters: page,
  render: ({ stand }) => <Dashboard direction={TIGHT} stand={stand} />,
};

/**
 * Every block on a card, as in Clerk's dashboards: the figures, the quotes, the timeline. The
 * card's edge holds the table where the rule did; its head carries the heading and the way to
 * the whole list; the column names stand on the well.
 */
export const Karte: Story = {
  parameters: page,
  render: ({ stand }) => <Dashboard direction={CARD} stand={stand} />,
};

/**
 * Nothing above the column names: the heading opens the table. The text and the hairlines stand
 * on the column's edges, under the heading; the washes are rounded and run past the text.
 */
export const Offen: Story = {
  parameters: page,
  render: ({ stand }) => <Dashboard direction={OPEN} stand={stand} />,
};

/**
 * The column names in a rounded band on the quiet surface, in place of the rule; the rows divided
 * by their rhythm, no lines. The figures stand on one plate of the same surface.
 */
export const Leiste: Story = {
  parameters: page,
  render: ({ stand }) => <Dashboard direction={BAND} stand={stand} />,
};

// --- the app's list --------------------------------------------------------------------------------

const QUOTES = [
  ["2026-0421", "Schreinerei Mustermann", "Website und Google-Profil", 2780, "Entwurf", "neutral"],
  ["2026-0418", "Bäckerei Kornprobst", "Website, Bestellformular", 4280, "Gesendet", "info"],
  ["2026-0412", "Friseursalon Haarscharf", "Terminbuchung", 1950, "Gesendet", "info"],
  ["2026-0409", "Gärtnerei Weiß", "Website, Pflanzenkatalog", 5640, "Entwurf", "neutral"],
  ["2026-0397", "Elektro Wagner", "Website, monatliche Pflege", 3120, "Überfällig", "danger"],
] as const;

/** A table in a direction's frame: on a card with a head, or bare as in the app's page. */
function Framed({
  direction,
  title,
  children,
}: {
  direction: Direction;
  title: string;
  children: ReactNode;
}) {
  if (!direction.card) return children;
  return (
    <div className="flex min-w-0 flex-col rounded-xl bg-surface depth-card">
      <p className="flex h-12 items-center border-b border-hairline px-5 font-semibold text-fg">
        {title}
      </p>
      {children}
    </div>
  );
}

function Quotes({
  direction,
  stand,
  ticked: initial,
}: {
  direction: Direction;
  stand: string;
  ticked: readonly string[];
}) {
  const [ticked, setTicked] = useState<readonly string[]>(initial);
  const all = ticked.length === QUOTES.length;
  const style = styleOf(direction, stand);
  const toggle = (id: string) =>
    setTicked((now) => (now.includes(id) ? now.filter((each) => each !== id) : [...now, id]));
  return (
    <Framed direction={direction} title="Offene Angebote">
      <Table aria-label={`Angebote (${direction.name})`} look={direction.look}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-0">
              <Checkbox
                aria-label="Alle Angebote auswählen"
                checked={all}
                indeterminate={ticked.length > 0 && !all}
                onCheckedChange={(checked) => setTicked(checked ? QUOTES.map(([id]) => id) : [])}
              />
            </TableHead>
            <TableHead className="w-full">Kunde</TableHead>
            <TableHead>Status</TableHead>
            <TableHead numeric>Betrag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {QUOTES.map(([id, customer, subject, amount, status, tone]) => (
            <TableRow key={id} selected={ticked.includes(id)}>
              <TableCell className="w-0">
                <Checkbox
                  aria-label={`Angebot für ${customer} auswählen`}
                  checked={ticked.includes(id)}
                  onCheckedChange={() => toggle(id)}
                />
              </TableCell>
              <TableCell className="w-full max-w-0">
                <Entry name={customer} detail={subject} />
              </TableCell>
              <TableCell>
                <State style={style} tone={tone}>
                  {status}
                </State>
              </TableCell>
              <TableCell numeric>{euro.format(amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Framed>
  );
}

/** The app's list of quotes with one row ticked, in each direction. Tick more to see a run. */
export const AppList: Story = {
  render: ({ stand }) => (
    <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-2">
      {DIRECTIONS.map((direction) => (
        <Option key={direction.name} direction={direction}>
          <Quotes direction={direction} stand={stand} ticked={["2026-0418"]} />
        </Option>
      ))}
    </div>
  ),
};

/** Three rows ticked one after another: one wash in every direction. */
export const SelectedRun: Story = {
  render: ({ stand }) => (
    <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-2">
      {DIRECTIONS.map((direction) => (
        <Option key={direction.name} direction={direction}>
          <Quotes
            direction={direction}
            stand={stand}
            ticked={["2026-0418", "2026-0412", "2026-0409"]}
          />
        </Option>
      ))}
    </div>
  ),
};

// --- two columns with avatars (Components/AvatarGroup, On row) ------------------------------------

/** A small portrait drawn inline, so the board needs no network. */
function portrait(skin: string, hair: string, shirt: string) {
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#d8d2c4"/><path d="M12 22c0-9 5-15 12-15s12 6 12 15v4H12z" fill="${hair}"/><circle cx="24" cy="21" r="9" fill="${skin}"/><path d="M6 48c2-11 9-16 18-16s16 5 18 16z" fill="${shirt}"/></svg>`,
    )
  );
}

const team: AvatarPerson[] = [
  { name: "Anna Weber", src: portrait("#e7b98f", "#4a3226", "#5f50d0"), presence: "online" },
  { name: "Jonas Klein", src: portrait("#c98e65", "#1f1a17", "#2f6f5e") },
  { name: "Lena Fischer" },
  { name: "Paul Wagner", src: portrait("#f0c9a4", "#b5793d", "#8a3b3b") },
  { name: "Mia Becker" },
];

function Editors({ direction }: { direction: Direction }) {
  return (
    <Framed direction={direction} title="In Arbeit">
      <Table aria-label={`Bearbeitete Angebote (${direction.name})`} look={direction.look}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">Angebot</TableHead>
            <TableHead>Bearbeitet von</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow selected>
            <TableCell>Einbauschrank Flur</TableCell>
            <TableCell>
              <AvatarGroup people={team} size="sm" label="Bearbeitet von" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Küchenfronten Eiche</TableCell>
            <TableCell>
              <AvatarGroup people={team.slice(2, 4)} size="sm" label="Bearbeitet von" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Framed>
  );
}

/** The two columns of `Components/AvatarGroup` (On row): one row selected, avatars beside. */
export const WithAvatars: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[repeat(2,minmax(0,35rem))]">
      {DIRECTIONS.map((direction) => (
        <Option key={direction.name} direction={direction}>
          <Editors direction={direction} />
        </Option>
      ))}
    </div>
  ),
};
