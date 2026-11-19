import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

import { AvatarGroup } from "@/components/avatar-group/avatar-group";
import type { AvatarPerson } from "@/components/avatar-group/people";
import { Badge } from "@/components/badge/badge";
import { Checkbox } from "@/components/checkbox/checkbox";
import { Heading } from "@/components/heading/heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  type TableLook,
  TableRow,
} from "@/components/table/table";
import { cn } from "@/lib/cn";

/**
 * The refinement of the record list (Justin, 2026-11-19: "too spacey", "it feels off"): today's
 * rows beside three refined directions, each in the three places the table was flagged in. The
 * dashboard's latest quotes, the app's list with checkboxes and a selected row, and the two
 * columns with avatars. A lab board is not part of the library: it goes when the pick is made.
 */
const meta = {
  title: "Lab/Table 2026-11-19",
  tags: ["visual-skip"],
  parameters: { layout: "padded", visual: { viewport: { width: 1290, height: 1000 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Direction = {
  name: string;
  note: string;
  look: TableLook;
  /** How a record is written: its name over a muted line, or both on one line. */
  lines: "two" | "one";
  /** How its state is shown: a `Badge`, or a dot and the word. */
  state: "badge" | "dot";
  proposal?: boolean;
};

const TODAY: Direction = {
  name: "Heute",
  note: "wie gebaut",
  look: "default",
  lines: "two",
  state: "badge",
};
const TIGHT: Direction = {
  name: "Straff",
  note: "derselbe Aufbau, enger gesetzt, die Werte beisammen am rechten Rand",
  look: "tight",
  lines: "two",
  state: "badge",
};
const ONE_LINE: Direction = {
  name: "Eine Zeile",
  note: "jedes Angebot eine Zeile, der Stand als Punkt und Wort",
  look: "tight",
  lines: "one",
  state: "dot",
};
const LIST: Direction = {
  name: "Liste",
  note: "Werte auf der ersten Zeile, Stand als Punkt, runde Flächen, bündig mit der Spalte",
  look: "list",
  lines: "two",
  state: "dot",
  proposal: true,
};
const DIRECTIONS = [TODAY, TIGHT, ONE_LINE, LIST];

/** One direction: what it is, above what it looks like. */
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

const dot: Record<Exclude<Tone, "neutral">, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/**
 * A state as a dot and its word, in the row's text colour: the hue is in the dot, the meaning in
 * the word. A draft is a ring: open, not yet anything. Lab only; it would become a `Badge`
 * variant if chosen.
 */
function StateDot({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0 rounded-full",
          tone === "neutral" ? "border-[1.5px] border-fg-muted" : dot[tone],
        )}
      />
      {children}
    </span>
  );
}

function State({
  direction,
  tone,
  children,
}: {
  direction: Direction;
  tone: Tone;
  children: string;
}) {
  return direction.state === "badge" ? (
    <Badge tone={tone}>{children}</Badge>
  ) : (
    <StateDot tone={tone}>{children}</StateDot>
  );
}

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

/** The record's name: a link, so the wash under the pointer leads somewhere. */
function RecordLink({ id, children }: { id: string; children: ReactNode }) {
  return (
    <a
      href={`#angebot-${id}`}
      className="truncate rounded-xs font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
    </a>
  );
}

/** The first cell: the record's name, with what it is about under it or beside it. */
function Entry({
  direction,
  id,
  name,
  detail,
  link = false,
}: {
  direction: Direction;
  id: string;
  name: string;
  detail: string;
  link?: boolean;
}) {
  const title = link ? (
    <RecordLink id={id}>{name}</RecordLink>
  ) : (
    <span className="truncate font-medium text-fg">{name}</span>
  );
  if (direction.lines === "one") {
    return (
      // The muted part gives way first; the name only once the muted part is gone.
      <div className="flex min-w-0 items-baseline gap-2.5 [&>*:first-child]:max-w-full [&>*:first-child]:shrink-0">
        {title}
        <span className="truncate text-sm text-fg-muted">{detail}</span>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col">
      {title}
      <span className="truncate text-sm text-fg-muted">{detail}</span>
    </div>
  );
}

/**
 * The column that takes what room is left: in a refined direction the first one, so the state
 * and the amount stand together at the right instead of spreading over the width; and it gives
 * way to a narrow window by cutting its text short. Today every column takes a share.
 */
const takesRoom = (direction: Direction) =>
  direction.look === "default" ? undefined : "w-full max-w-0";

// --- the dashboard's latest quotes --------------------------------------------------------------

const LATEST = [
  ["A-2026-0421", "Schreinerei Mustermann", "Einbauschrank Flur", 2780, "Entwurf", "neutral"],
  ["A-2026-0418", "Bäckerei Kornprobst", "Ladeneinrichtung", 4280, "Gesendet", "info"],
  ["A-2026-0412", "Friseursalon Haarscharf", "Empfangstresen", 1950, "Angenommen", "success"],
  ["A-2026-0409", "Gärtnerei Weiß", "Pflanztische", 5640, "Gesendet", "info"],
  ["A-2026-0397", "Elektro Wagner", "Werkbank", 3120, "Abgelaufen", "danger"],
] as const;

function Latest({ direction }: { direction: Direction }) {
  return (
    <div className="flex w-full max-w-[31.25rem] min-w-0 flex-col gap-3">
      <Heading level={2} size="label">
        Neueste Angebote
      </Heading>
      <Table aria-label={`Neueste Angebote (${direction.name})`} look={direction.look}>
        <TableHeader>
          <TableRow>
            <TableHead className={cn(direction.look !== "default" && "w-full")}>Kunde</TableHead>
            <TableHead>Stand</TableHead>
            <TableHead numeric>Betrag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {LATEST.map(([id, customer, subject, amount, status, tone]) => (
            <TableRow key={id} interactive>
              <TableCell className={takesRoom(direction)}>
                <Entry
                  direction={direction}
                  id={id}
                  name={customer}
                  detail={direction.lines === "one" ? subject : `${id} · ${subject}`}
                  link
                />
              </TableCell>
              <TableCell>
                <State direction={direction} tone={tone}>
                  {status}
                </State>
              </TableCell>
              <TableCell numeric>{euro.format(amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * The dashboard's „Neueste Angebote“ at the width it has there (500px), as Justin saw it and in
 * each direction. Point at a row: it washes, and its name is the link.
 */
export const LatestQuotes: Story = {
  parameters: {
    visual: { target: '[data-look="list"] [data-slot="table-row"][data-interactive]' },
  },
  render: () => (
    <div className="grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[repeat(2,minmax(0,31.25rem))]">
      {DIRECTIONS.map((direction) => (
        <Option key={direction.name} direction={direction}>
          <Latest direction={direction} />
        </Option>
      ))}
    </div>
  ),
};

// --- the app's list --------------------------------------------------------------------------------

const QUOTES = [
  ["2026-0421", "Schreinerei Mustermann", "Website und Google-Profil", 2780, "Entwurf", "neutral"],
  ["2026-0418", "Bäckerei Kornprobst", "Website, Bestellformular", 4280, "Gesendet", "info"],
  ["2026-0412", "Friseursalon Haarscharf", "Terminbuchung", 1950, "Gesendet", "info"],
  ["2026-0409", "Gärtnerei Weiß", "Website, Pflanzenkatalog", 5640, "Entwurf", "neutral"],
  ["2026-0397", "Elektro Wagner", "Website, monatliche Pflege", 3120, "Überfällig", "danger"],
] as const;

function Quotes({
  direction,
  ticked: initial,
  rows = QUOTES,
}: {
  direction: Direction;
  ticked: readonly string[];
  rows?: readonly (typeof QUOTES)[number][];
}) {
  const [ticked, setTicked] = useState<readonly string[]>(initial);
  const all = ticked.length === rows.length;
  const toggle = (id: string) =>
    setTicked((now) => (now.includes(id) ? now.filter((each) => each !== id) : [...now, id]));
  return (
    <Table aria-label={`Angebote (${direction.name})`} look={direction.look}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-0">
            <Checkbox
              aria-label="Alle Angebote auswählen"
              checked={all}
              indeterminate={ticked.length > 0 && !all}
              onCheckedChange={(checked) => setTicked(checked ? rows.map(([id]) => id) : [])}
            />
          </TableHead>
          <TableHead className={cn(direction.look !== "default" && "w-full")}>Kunde</TableHead>
          <TableHead>Status</TableHead>
          <TableHead numeric>Betrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(([id, customer, subject, amount, status, tone]) => (
          <TableRow key={id} selected={ticked.includes(id)}>
            <TableCell className="w-0">
              <Checkbox
                aria-label={`Angebot für ${customer} auswählen`}
                checked={ticked.includes(id)}
                onCheckedChange={() => toggle(id)}
              />
            </TableCell>
            <TableCell className={takesRoom(direction)}>
              <Entry direction={direction} id={id} name={customer} detail={subject} />
            </TableCell>
            <TableCell>
              <State direction={direction} tone={tone}>
                {status}
              </State>
            </TableCell>
            <TableCell numeric>{euro.format(amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** The app's list of quotes, with one row ticked. Tick another to see a run of selected rows. */
export const AppList: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-2">
      {DIRECTIONS.map((direction) => (
        <Option key={direction.name} direction={direction}>
          <Quotes direction={direction} ticked={["2026-0418"]} />
        </Option>
      ))}
    </div>
  ),
};

/** Three rows ticked one after another: are they one wash, or three stripes between lines? */
export const SelectedRun: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-2">
      {DIRECTIONS.map((direction) => (
        <Option key={direction.name} direction={direction}>
          <Quotes direction={direction} ticked={["2026-0418", "2026-0412", "2026-0409"]} />
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
    <Table aria-label={`Bearbeitete Angebote (${direction.name})`} look={direction.look}>
      <TableHeader>
        <TableRow>
          <TableHead className={cn(direction.look !== "default" && "w-full")}>Angebot</TableHead>
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
  );
}

/**
 * The two columns of `Components/AvatarGroup` (On row): one row selected, avatars in the second
 * column. Today the row whose first avatar is a picture stands taller than the one with
 * initials. „Eine Zeile“ is the same as „Straff“ here.
 */
export const WithAvatars: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-[repeat(2,minmax(0,35rem))]">
      {[TODAY, TIGHT, LIST].map((direction) => (
        <Option key={direction.name} direction={direction}>
          <Editors direction={direction} />
        </Option>
      ))}
    </div>
  ),
};
