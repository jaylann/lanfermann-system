import {
  AiIdeaIcon,
  Calendar03Icon,
  Clock01Icon,
  CodeIcon,
  Delete02Icon,
  Download01Icon,
  EuroIcon,
  Hammer01Icon,
  Mail01Icon,
  Mortarboard01Icon,
  News01Icon,
  RefreshIcon,
  SentIcon,
  SmartPhone01Icon,
  Store01Icon,
  UserIcon,
  WebDesign01Icon,
  WorkflowSquare03Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps, CSSProperties, PointerEvent, ReactNode } from "react";

import { ActionBar, ActionBarButton } from "@/components/action-bar/action-bar";
import {
  Attachment,
  type AttachmentNameCut,
  AttachmentNameCutContext,
} from "@/components/attachment/attachment";
import { KINDS } from "@/components/attachment/story-files";
import { Button } from "@/components/button/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/card/card";
import { Checkbox } from "@/components/checkbox/checkbox";
import { CheckboxCard } from "@/components/checkbox-card/checkbox-card";
import { CheckboxGroup } from "@/components/checkbox-group/checkbox-group";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  type ComboboxOption,
} from "@/components/combobox/combobox";
import { CopyButton } from "@/components/copy-button/copy-button";
import { Field, FieldDescription, FieldLabel } from "@/components/field/field";
import { Icon } from "@/components/icon/icon";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/menu/menu";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageFeedback,
  MessageFeedbackLookContext,
} from "@/components/message/message";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuLinkDescription,
  NavigationMenuLinkTitle,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/navigation-menu/navigation-menu";
import { OtpField, type OtpHaloPace, OtpHaloPaceContext } from "@/components/otp-field/otp-field";
import { RadioGroup } from "@/components/radio/radio";
import { RadioCard } from "@/components/radio-card/radio-card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/select/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";
import { ChevronDownGlyph } from "@/internal/glyphs";
import { type ListMarking, ListMarkingContext } from "@/internal/list-mark";
import { type TileLook, TileLookContext } from "@/internal/tile";

/**
 * Justin's review of 2026-11-20, as switches side by side at real size: one story per question.
 * Every option is the component itself with one setting changed (a context or a few depth
 * variables), so a pick only deletes the others. Lab boards are not part of the library and go
 * once the picks are made.
 */
const meta = {
  title: "Lab/Review 2026-11-20",
  tags: ["visual-skip"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/**
 * The options that only the lab draws: the cuts of the bevelled card and the hovers of a choice
 * card. Scoped to a column by its `data-lab-*` attribute, per ground where a value differs.
 */
const LAB_CSS = `
[data-lab-bevel="lippe"] {
  --bevel-contact-y: 2px; --bevel-contact-blur: 0px; --bevel-lip: 2px;
  --depth-bevel-contact: rgb(19 18 28 / 0.13);
  --depth-bevel-lo: rgb(19 18 28 / 0.07);
}
[data-theme="ink"] [data-lab-bevel="lippe"] {
  --depth-bevel-contact: rgb(0 0 0 / 0.75);
  --depth-bevel-lo: rgb(0 0 0 / 0.4);
}
[data-lab-bevel="glanz"] {
  --depth-bevel-face: linear-gradient(rgb(255 255 255 / 0), rgb(42 37 82 / 0.075));
  --depth-bevel-lo: rgb(19 18 28 / 0.08);
}
[data-theme="ink"] [data-lab-bevel="glanz"] {
  --depth-bevel-face: linear-gradient(rgb(255 255 255 / 0.085), rgb(255 255 255 / 0.015));
  --depth-bevel-hi: rgb(255 255 255 / 0.14);
  --depth-bevel-lo: rgb(0 0 0 / 0.35);
}

[data-lab-hover] :is([data-slot="radio-card"], [data-slot="checkbox-card"]) { isolation: isolate; }

[data-lab-hover="hub"] :is([data-slot="radio-card"], [data-slot="checkbox-card"]) {
  --depth-bevel-edge-hover: var(--depth-bevel-edge);
  transition:
    box-shadow var(--transition-duration-spring-leave) var(--ease-spring-leave),
    translate var(--transition-duration-spring-seat) var(--ease-spring-seat);
}
[data-lab-hover="hub"] :is([data-slot="radio-card"], [data-slot="checkbox-card"])::after {
  content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none;
  box-shadow: 0 2px 4px -1px var(--depth-bevel-ambient), 0 10px 22px -10px var(--depth-bevel-ambient);
  opacity: 0;
  transition: opacity var(--transition-duration-spring-snap) var(--ease-spring-snap);
}
@media (hover: hover) {
  [data-lab-hover="hub"] :is([data-slot="radio-card"], [data-slot="checkbox-card"]):hover:not(:active) {
    translate: 0 -1px;
    transition:
      box-shadow var(--transition-duration-spring-snap) var(--ease-spring-snap),
      translate var(--transition-duration-spring-snap) var(--ease-spring-snap);
  }
  [data-lab-hover="hub"] :is([data-slot="radio-card"], [data-slot="checkbox-card"]):hover:not(:active)::after { opacity: 1; }
}

[data-lab-hover="licht"] :is([data-slot="radio-card"], [data-slot="checkbox-card"]) {
  --depth-bevel-edge-hover: var(--depth-bevel-edge);
}
[data-lab-hover="licht"] :is([data-slot="radio-card"], [data-slot="checkbox-card"])::before {
  content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none;
  background: radial-gradient(240px circle at var(--x, 50%) var(--y, 50%), rgb(95 80 208 / 0.07), transparent 70%);
  opacity: 0;
  transition: opacity var(--transition-duration-spring-settle) var(--ease-spring-settle);
}
[data-theme="ink"] [data-lab-hover="licht"] :is([data-slot="radio-card"], [data-slot="checkbox-card"])::before {
  background: radial-gradient(240px circle at var(--x, 50%) var(--y, 50%), rgb(255 255 255 / 0.06), transparent 70%);
}
@media (hover: hover) {
  [data-lab-hover="licht"] :is([data-slot="radio-card"], [data-slot="checkbox-card"]):hover::before { opacity: 1; }
}
`;

function LabStyle() {
  return <style>{LAB_CSS}</style>;
}

/** One option: its name and a line on what it is, above it. */
function Option({
  name,
  note,
  children,
  ...props
}: ComponentProps<"section"> & {
  name: string;
  note: string;
  [data: `data-${string}`]: string | undefined;
}) {
  return (
    <section {...props}>
      <h3 className="text-control font-semibold text-fg">{name}</h3>
      <p className="mb-4 max-w-80 text-sm text-fg-muted">{note}</p>
      {children}
    </section>
  );
}

function Board({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className ?? "grid grid-cols-1 gap-10 p-8 md:grid-cols-3"}>
      <LabStyle />
      {children}
    </div>
  );
}

// --- #4 the card's shadow -------------------------------------------------------------------

function PlanCard() {
  return (
    <Card className="w-full max-w-80">
      <CardHeader className="pb-5">
        <CardTitle className="text-control font-medium">Jährlich abrechnen</CardTitle>
      </CardHeader>
      <CardFooter>Nächste Rechnung am 1. Dezember</CardFooter>
    </Card>
  );
}

const cardShadows = [
  {
    name: "Heute",
    note: "Der weite weiche Schatten: 12px tief, 28px weich.",
    style: undefined,
  },
  {
    name: "Kürzer",
    note: "Halb so tief und weich: 6px, 16px.",
    style: { "--card-far-y": "6px", "--card-far-blur": "16px", "--card-far-spread": "-6px" },
  },
  {
    name: "Knapp",
    note: "Kaum mehr als die Kante und der nahe Schatten: 3px, 8px.",
    style: { "--card-far-y": "3px", "--card-far-blur": "8px", "--card-far-spread": "-4px" },
  },
] as const;

/** #4: how far a card's soft shadow reaches ("a bit too spreaded shadow imho"). */
export const CardShadow: Story = {
  name: "Karte: Schatten",
  render: () => (
    <Board>
      {cardShadows.map((option) => (
        <Option
          key={option.name}
          name={option.name}
          note={option.note}
          style={option.style as CSSProperties | undefined}
        >
          <PlanCard />
        </Option>
      ))}
    </Board>
  ),
};

// --- #6 the bevelled card -------------------------------------------------------------------

function PromptCard({ title, prompt, tools }: { title: string; prompt: string; tools: string }) {
  return (
    <Card variant="bevel" className="w-full max-w-96">
      <CardContent className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-fg-muted">{title}</span>
          <CopyButton text={prompt} size="sm" copyLabel="Vorlage kopieren" />
        </div>
        <p className="text-lg leading-snug font-medium text-balance text-fg">„{prompt}“</p>
        <p className="font-mono text-xs text-fg-muted">{tools}</p>
      </CardContent>
    </Card>
  );
}

const bevels = [
  {
    cut: "fase",
    name: "Fase",
    note: "Das Rezept eines Knopfs in Kartengröße: Kante, Licht oben, 1px Schatten unten.",
  },
  {
    cut: "lippe",
    name: "Lippe",
    note: "Eine 2px Lippe am Fuß, innen und außen: das gefräste Teil.",
  },
  {
    cut: "glanz",
    name: "Glanz",
    note: "Die Fläche glänzt sichtbar und wird nach unten dunkler, wie Clerk auf Ink.",
  },
] as const;

/** #6: the card cut like a fitting, for things that are handled (Clerk's prompt cards). */
export const BevelCard: Story = {
  name: "Karte: Fase",
  render: () => (
    <Board>
      {bevels.map((option) => (
        <Option key={option.cut} name={option.name} note={option.note} data-lab-bevel={option.cut}>
          <div className="flex flex-col gap-4">
            <PromptCard
              title="Angebot nachfassen"
              prompt="Schreib Bäckerei Kornprobst, ob das Angebot vom 12. November noch Fragen offen lässt."
              tools="angebote_lesen · mail_entwurf"
            />
            <PromptCard
              title="Monatsabschluss"
              prompt="Welche Rechnungen aus dem Oktober sind noch offen?"
              tools="rechnungen_lesen"
            />
          </div>
        </Option>
      ))}
    </Board>
  ),
};

// --- #7 #16 choice cards on the bevel, and their hover --------------------------------------

/** For `licht`: where the pointer is on the card under it, written onto that card. */
function follow(event: PointerEvent<HTMLElement>) {
  const card = (event.target as Element).closest<HTMLElement>(
    '[data-slot="radio-card"], [data-slot="checkbox-card"]',
  );
  if (!card) return;
  const box = card.getBoundingClientRect();
  card.style.setProperty("--x", `${event.clientX - box.left}px`);
  card.style.setProperty("--y", `${event.clientY - box.top}px`);
}

const hovers = [
  {
    hover: "kante",
    name: "Kante",
    note: "Unter dem Zeiger wird die Kante fester. Nichts hebt sich, kein Schatten wächst.",
  },
  {
    hover: "hub",
    name: "Hub",
    note: "Die Karte hebt sich um 1px, ein kurzer Schatten blendet unter ihr ein.",
  },
  {
    hover: "licht",
    name: "Licht",
    note: "Ein weiches Licht folgt dem Zeiger über die Fläche. Kante und Schatten bleiben.",
  },
] as const;

/** #7 #16: the choice cards on the bevel, and how they answer the pointer. Hover them. */
export const ChoiceCards: Story = {
  name: "Auswahlkarten: Hover",
  render: () => (
    <Board>
      {hovers.map((option) => (
        <Option
          key={option.hover}
          name={option.name}
          note={option.note}
          data-lab-hover={option.hover}
          onPointerMove={option.hover === "licht" ? follow : undefined}
        >
          <div className="flex flex-col gap-3">
            <RadioGroup
              aria-label={`Tarif (${option.name})`}
              defaultValue="team"
              className="grid gap-3"
            >
              <RadioCard
                value="solo"
                title="Solo"
                detail="12 € im Monat"
                description="Für eine Person. Angebote, Rechnungen und ein Postfach."
              />
              <RadioCard
                value="team"
                title="Team"
                detail="29 € im Monat"
                description="Bis zu zehn Personen, gemeinsame Vorlagen und Freigaben."
              />
            </RadioGroup>
            <CheckboxGroup
              aria-label={`Bereiche (${option.name})`}
              defaultValue={["angebote"]}
              className="grid gap-3"
            >
              <CheckboxCard
                value="angebote"
                title="Angebote schreiben"
                description="Vorlagen, Positionen und die Freigabe durch die Kundin."
              />
              <CheckboxCard
                value="zeiten"
                title="Zeiten erfassen"
                description="Stunden je Auftrag, als Grundlage für die Rechnung."
              />
            </CheckboxGroup>
          </div>
        </Option>
      ))}
    </Board>
  ),
};

// --- #1 the action bar ----------------------------------------------------------------------

const docks = [
  {
    name: "Heute",
    note: "Ein Blatt wie ein Menü: flach, mit dem langen Schatten.",
    style: undefined,
    today: true,
  },
  {
    name: "Nah",
    note: "Gefräst wie ein Knopf, darunter ein kürzerer Schwebeschatten.",
    style: {
      "--dock-near-y": "8px",
      "--dock-near-blur": "20px",
      "--dock-near-spread": "-8px",
      "--dock-far-y": "18px",
      "--dock-far-blur": "40px",
      "--dock-far-spread": "-16px",
    },
    today: false,
  },
  {
    name: "Mittel",
    note: "Gefräst wie ein Knopf, darunter ein langer, weiter Schatten.",
    style: undefined,
    today: false,
  },
  {
    name: "Weit",
    note: "Gefräst wie ein Knopf, der Schatten noch weiter: es schwebt deutlich.",
    style: {
      "--dock-near-y": "16px",
      "--dock-near-blur": "36px",
      "--dock-near-spread": "-12px",
      "--dock-far-y": "36px",
      "--dock-far-blur": "80px",
      "--dock-far-spread": "-24px",
    },
    today: false,
  },
] as const;

const QUOTES = [
  { id: "2026-0421", customer: "Schreinerei Mustermann", amount: 2780, ticked: true },
  { id: "2026-0418", customer: "Bäckerei Kornprobst", amount: 4280, ticked: true },
  { id: "2026-0412", customer: "Friseursalon Haarscharf", amount: 1950, ticked: false },
  { id: "2026-0397", customer: "Elektro Wagner", amount: 3120, ticked: false },
  { id: "2026-0391", customer: "Gärtnerei Weiß", amount: 860, ticked: false },
] as const;

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

/**
 * A list of quotes with two rows ticked, and the bar floating over its last rows as it floats
 * over a page in an app. Nothing clips it, and there is room under the list, so its shadow
 * falls all the way out over the rows and the ground (the first board cut it off).
 */
function Bar({ ground, today }: { ground: "ink" | "paper"; today: boolean }) {
  const label = ground === "ink" ? "dunkel" : "hell";
  return (
    <div className="relative mb-16">
      <Card>
        <Table aria-label={`Angebote (${label})`}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-0">
                <Checkbox aria-label={`Alle Angebote auswählen (${label})`} indeterminate />
              </TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead numeric>Betrag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {QUOTES.map((quote) => (
              <TableRow key={quote.id} selected={quote.ticked}>
                <TableCell className="w-0">
                  <Checkbox
                    aria-label={`Angebot für ${quote.customer} auswählen (${label})`}
                    defaultChecked={quote.ticked}
                  />
                </TableCell>
                <TableCell className="font-medium text-fg">{quote.customer}</TableCell>
                <TableCell numeric>{euro.format(quote.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ActionBar
        position="absolute"
        ground={ground}
        open
        count={2}
        onClear={() => {}}
        aria-label={`Auswahl (${ground})`}
        className={today ? "bg-sheet depth-floating" : undefined}
      >
        <ActionBarButton>
          <Icon icon={SentIcon} size={14} />
          Senden
        </ActionBarButton>
        <ActionBarButton>
          <Icon icon={Download01Icon} size={14} />
          Als PDF
        </ActionBarButton>
        <ActionBarButton>
          <Icon icon={Delete02Icon} size={14} />
          Löschen
        </ActionBarButton>
      </ActionBar>
    </div>
  );
}

/** #1: the action bar cut like a key that floats, and how far its shadow reaches. */
export const Dock: Story = {
  name: "Aktionsleiste: Fräsung",
  render: () => (
    <Board className="grid grid-cols-1 gap-10 p-8 md:grid-cols-2">
      {docks.map((option) => (
        <Option
          key={option.name}
          name={option.name}
          note={option.note}
          style={option.style as CSSProperties | undefined}
        >
          <div className="flex flex-col gap-2">
            <Bar ground="ink" today={option.today} />
            <Bar ground="paper" today={option.today} />
          </div>
        </Option>
      ))}
    </Board>
  ),
};

// --- #2 #3 attachments ----------------------------------------------------------------------

const cuts: { cut: AttachmentNameCut; name: string; note: string }[] = [
  {
    cut: "middle",
    name: "Mitte",
    note: "Wie im Finder: „Angebot-Ko…bst.pdf“. Endung und Ende bleiben, genau geschnitten.",
  },
  {
    cut: "end",
    name: "Ende",
    note: "„Angebot-Kornp….pdf“: der Name endet mit dem Auslassungszeichen, die Endung bleibt.",
  },
  {
    cut: "fade",
    name: "Blende (heute)",
    note: "Der Name blendet vor der Endung aus.",
  },
];

/** #3: how a name too long for its chip is cut, also beside „Fehlgeschlagen“. */
export const NameCut: Story = {
  name: "Anhänge: Schnitt",
  render: () => (
    <Board>
      {cuts.map((option) => (
        <Option key={option.cut} name={option.name} note={option.note}>
          <AttachmentNameCutContext value={option.cut}>
            <div className="flex flex-col items-start gap-2">
              <Attachment variant="chip" {...KINDS[0]!} className="max-w-48" onRemove={() => {}} />
              <Attachment variant="chip" {...KINDS[3]!} className="max-w-48" onRemove={() => {}} />
              <Attachment
                variant="chip"
                {...KINDS[0]!}
                status="error"
                className="max-w-64"
                onRemove={() => {}}
              />
              <Attachment variant="chip" {...KINDS[4]!} className="max-w-48" onRemove={() => {}} />
            </div>
          </AttachmentNameCutContext>
        </Option>
      ))}
    </Board>
  ),
};

/** #2: the attachment chips as plugs and flat, side by side. */
export const AttachmentFaces: Story = {
  name: "Anhänge: Flach",
  render: () => (
    <Board className="grid grid-cols-1 gap-10 p-8 md:grid-cols-2">
      {(["plug", "flat"] as const).map((face) => (
        <Option
          key={face}
          name={face === "plug" ? "Stecker (heute)" : "Flach"}
          note={
            face === "plug"
              ? "Kleine erhabene Teile mit Kante und Schatten."
              : "Ruhig wie ein Badge: eine Fläche mit feiner Kante, ohne Schatten."
          }
        >
          <div className="flex flex-wrap gap-2">
            {KINDS.map((file) => (
              <Attachment
                key={file.id}
                variant="chip"
                chipVariant={face}
                {...file}
                onRemove={() => {}}
              />
            ))}
          </div>
        </Option>
      ))}
    </Board>
  ),
};

// --- #8 #9 #11 #18 #19 the mark of a chosen row ---------------------------------------------

const markings: { value: ListMarking; name: string; note: string }[] = [
  {
    value: { marking: "tick", single: "tick" },
    name: "Haken",
    note: "Ein Haken am rechten Ende, nach dem Detail. Jede Zeile hält seinen Platz frei.",
  },
  {
    value: { marking: "tick", single: "disc" },
    name: "Haken, Scheibe",
    note: "Wie Haken, nur bei einer einzigen Wahl die Scheibe statt des Hakens.",
  },
  {
    value: { marking: "tint", single: "tick" },
    name: "Tönung",
    note: "Die gewählte Zeile steht auf der Tönung, wie die aktuelle Seite in der Seitenleiste. Kein Zeichen.",
  },
  {
    value: { marking: "accent", single: "tick" },
    name: "Akzent",
    note: "Die Bezeichnung der gewählten Zeile in Indigo und etwas kräftiger. Kein Zeichen.",
  },
];

const PLANS = [
  { value: "start", label: "Start", detail: "49 € / Monat" },
  { value: "werkstatt", label: "Werkstatt", detail: "89 € / Monat" },
  { value: "betrieb", label: "Betrieb", detail: "149 € / Monat" },
  { value: "einmalig", label: "Einmalig", detail: "ab 2.400 €" },
];

/** #8 #9 #19: a select whose rows carry a price at the right, open in every marking. */
export const ListPrices: Story = {
  name: "Listen: mit Detail",
  render: () => (
    <Board className="grid min-h-[420px] grid-cols-2 gap-x-8 gap-y-10 p-8 xl:grid-cols-4">
      {markings.map((option) => (
        <Option key={option.name} name={option.name} note={option.note}>
          <ListMarkingContext value={option.value}>
            <Select items={PLANS} defaultValue="werkstatt" defaultOpen modal={false}>
              <SelectTrigger aria-label={`Tarif (${option.name})`} className="w-64" />
              <SelectContent>
                <SelectGroup>
                  <SelectGroupLabel>Mit monatlicher Pflege</SelectGroupLabel>
                  {PLANS.slice(0, 3).map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectItem value="einmalig">Einmalig</SelectItem>
              </SelectContent>
            </Select>
          </ListMarkingContext>
        </Option>
      ))}
    </Board>
  ),
};

type Customer = ComboboxOption & { detail: string };
const CUSTOMERS: Customer[] = [
  { value: "k-1042", label: "Schreinerei Mustermann", detail: "Rosenheim" },
  { value: "k-1043", label: "Bäckerei Kornprobst", detail: "München" },
  { value: "k-1046", label: "Metzgerei Obermaier", detail: "Erding" },
  { value: "k-1047", label: "Zimmerei Huber", detail: "Bad Tölz" },
  { value: "k-1049", label: "Gärtnerei Blattwerk", detail: "Dachau" },
];

/**
 * Several popups open at once exist only on this board: their focus guards and landmarks stand
 * side by side, which axe reports. Each component's own stories are checked one at a time.
 */
const severalOpen = { a11y: { test: "off" } } as const;

/** #9: a combobox with the place at the right, the chosen one in every marking. */
export const ListPlaces: Story = {
  name: "Listen: Orte",
  parameters: severalOpen,
  render: () => (
    <Board className="grid min-h-[440px] grid-cols-2 gap-x-8 gap-y-10 p-8 xl:grid-cols-4">
      {markings.map((option) => (
        <Option key={option.name} name={option.name} note={option.note}>
          <ListMarkingContext value={option.value}>
            <Field className="w-72">
              <FieldLabel>Kunde</FieldLabel>
              <Combobox items={CUSTOMERS} locale="de-DE" defaultOpen defaultValue={CUSTOMERS[1]}>
                <ComboboxInput placeholder="z. B. Schreinerei Huber" />
                <ComboboxContent empty="Kein Kunde gefunden.">
                  {(customer: Customer) => <ComboboxItem key={customer.value} value={customer} />}
                </ComboboxContent>
              </Combobox>
            </Field>
          </ListMarkingContext>
        </Option>
      ))}
    </Board>
  ),
};

/** #11: a menu of options with symbols, in every marking. */
export const ListMenu: Story = {
  name: "Listen: Menü",
  render: () => (
    <Board className="grid min-h-[520px] grid-cols-2 gap-x-8 gap-y-10 p-8 xl:grid-cols-4">
      {markings.map((option) => (
        <Option key={option.name} name={option.name} note={option.note}>
          <ListMarkingContext value={option.value}>
            <Menu defaultOpen modal={false}>
              <MenuTrigger
                render={
                  <Button>
                    Ansicht
                    <ChevronDownGlyph className="text-fg-muted" />
                  </Button>
                }
              />
              <MenuContent>
                <MenuGroup>
                  <MenuGroupLabel>Spalten</MenuGroupLabel>
                  <MenuCheckboxItem icon={UserIcon} defaultChecked>
                    Kunde
                  </MenuCheckboxItem>
                  <MenuCheckboxItem icon={EuroIcon} defaultChecked>
                    Betrag
                  </MenuCheckboxItem>
                  <MenuCheckboxItem icon={Clock01Icon}>Zuletzt geändert</MenuCheckboxItem>
                </MenuGroup>
                <MenuSeparator />
                <MenuRadioGroup defaultValue="datum">
                  <MenuGroupLabel>Sortieren nach</MenuGroupLabel>
                  <MenuRadioItem icon={Calendar03Icon} value="datum">
                    Datum
                  </MenuRadioItem>
                  <MenuRadioItem icon={EuroIcon} value="betrag">
                    Betrag
                  </MenuRadioItem>
                  <MenuRadioItem icon={UserIcon} value="kunde">
                    Kunde
                  </MenuRadioItem>
                </MenuRadioGroup>
                <MenuSeparator />
                <MenuSub>
                  <MenuSubTrigger icon={Download01Icon}>Exportieren</MenuSubTrigger>
                  <MenuSubContent>
                    <MenuItem>Als PDF</MenuItem>
                    <MenuItem>Als CSV</MenuItem>
                  </MenuSubContent>
                </MenuSub>
              </MenuContent>
            </Menu>
          </ListMarkingContext>
        </Option>
      ))}
    </Board>
  ),
};

// --- #12 #13 #14 symbols in the navigation menu ----------------------------------------------

const tiles: { value: TileLook; name: string; note: string }[] = [
  {
    value: { look: "raised", size: 32 },
    name: "Erhaben, 32",
    note: "Ein kleiner Stecker mit Glanz und Kante, 32px.",
  },
  {
    value: { look: "raised", size: 36 },
    name: "Erhaben, 36",
    note: "Derselbe, 36px mit 18px Symbol, wie bei Clerk.",
  },
  {
    value: { look: "flat", size: 32 },
    name: "Flach, 32",
    note: "Ein Quadrat mit feiner Kante, wie im Menü von CopyPage.",
  },
  { value: { look: "flat", size: 36 }, name: "Flach, 36", note: "Dasselbe, 36px mit 18px Symbol." },
];

const services = [
  {
    href: "#websites",
    title: "Websites",
    text: "Für Betriebe, die gefunden werden wollen",
    icon: WebDesign01Icon,
  },
  {
    href: "#apps",
    title: "Apps",
    text: "Für das Web und für iOS, vom Plan bis zum Start",
    icon: SmartPhone01Icon,
  },
  {
    href: "#programme",
    title: "Programme",
    text: "Für Angebote, Termine und alles, was sich wiederholt",
    icon: WorkflowSquare03Icon,
  },
  {
    href: "#beratung",
    title: "Beratung",
    text: "Wo KI im Betrieb Arbeit abnimmt und wo nicht",
    icon: AiIdeaIcon,
  },
] as const;

const places = [
  { href: "#open-source", title: "Open Source", icon: CodeIcon },
  { href: "#artikel", title: "Artikel", icon: News01Icon },
  { href: "#kunden", title: "Kunden", icon: Store01Icon },
  { href: "#vortraege", title: "Vorträge", icon: Mortarboard01Icon },
  { href: "#werkzeuge", title: "Werkzeuge", icon: Hammer01Icon },
  { href: "#kontakt", title: "Kontakt", icon: Mail01Icon },
] as const;

function NavWithTiles({ label, open }: { label: string; open: "leistungen" | "arbeiten" }) {
  return (
    <NavigationMenu aria-label={label} defaultValue={open}>
      <NavigationMenuList>
        <NavigationMenuItem value="leistungen">
          <NavigationMenuTrigger>Leistungen</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-[24rem]">
              {services.map((page) => (
                <li key={page.href}>
                  <NavigationMenuLink href={page.href} icon={page.icon}>
                    <NavigationMenuLinkTitle>{page.title}</NavigationMenuLinkTitle>
                    <NavigationMenuLinkDescription>{page.text}</NavigationMenuLinkDescription>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="arbeiten">
          <NavigationMenuTrigger>Arbeiten</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[24rem] grid-cols-2">
              {places.map((page) => (
                <li key={page.href}>
                  <NavigationMenuLink href={page.href} icon={page.icon}>
                    <NavigationMenuLinkTitle>{page.title}</NavigationMenuLinkTitle>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

/** #12 #13: pages with their symbols in tiles, in each tile. */
export const NavTiles: Story = {
  name: "Navigation: Kacheln",
  parameters: severalOpen,
  render: () => (
    <Board className="grid grid-cols-1 gap-x-10 gap-y-8 p-8 lg:grid-cols-2">
      {tiles.map((option) => (
        <Option key={option.name} name={option.name} note={option.note} className="h-[25rem]">
          <TileLookContext value={option.value}>
            <NavWithTiles label={`Hauptnavigation (${option.name})`} open="leistungen" />
          </TileLookContext>
        </Option>
      ))}
    </Board>
  ),
};

/** #14: the compact grid of places, tile and title, in each tile. */
export const NavGrid: Story = {
  name: "Navigation: Raster",
  parameters: severalOpen,
  render: () => (
    <Board className="grid grid-cols-1 gap-x-10 gap-y-8 p-8 lg:grid-cols-2">
      {tiles.map((option) => (
        <Option key={option.name} name={option.name} note={option.note} className="h-[19rem]">
          <TileLookContext value={option.value}>
            <NavWithTiles label={`Hauptnavigation (${option.name})`} open="arbeiten" />
          </TileLookContext>
        </Option>
      ))}
    </Board>
  ),
};

// --- #10 the keys under an answer ------------------------------------------------------------

const ANSWER =
  "Bäckerei Kornprobst hat das Angebot am 12. November geöffnet, aber noch nicht angenommen. Ein kurzes Nachfassen mit dem Liefertermin der Theke wäre jetzt passend.";

/** #10: copy, the verdict and „Noch einmal“ under an answer. Press the thumbs and the arrow. */
export const MessageKeys: Story = {
  name: "Antwort: Tasten",
  render: () => (
    <Board className="grid grid-cols-1 gap-10 p-8 md:grid-cols-2">
      {(["wash", "bare"] as const).map((look) => (
        <Option
          key={look}
          name={look === "wash" ? "Fläche (heute)" : "Ohne Fläche"}
          note={
            look === "wash"
              ? "Der gewählte Daumen steht auf dem grauen Quadrat einer gedrückten Taste."
              : "Kein Quadrat: der gewählte Daumen in der Textfarbe, der andere bleibt gedämpft."
          }
        >
          <MessageFeedbackLookContext value={look}>
            <Message from="assistant">
              <MessageContent>{ANSWER}</MessageContent>
              <MessageActions>
                <CopyButton text={ANSWER} size="sm" copyLabel="Antwort kopieren" />
                <MessageFeedback defaultValue="good" />
                <MessageAction icon={RefreshIcon} label="Noch einmal" iconMotion="turn" />
              </MessageActions>
            </Message>
          </MessageFeedbackLookContext>
        </Option>
      ))}
    </Board>
  ),
};

// --- #15 the halo of a code field ------------------------------------------------------------

const paces: { pace: OtpHaloPace; name: string; note: string }[] = [
  {
    pace: "snap",
    name: "Gleiten",
    note: "Ein runder Halo gleitet zum nächsten Feld, auf der schnellsten Feder (120ms).",
  },
  {
    pace: "glide",
    name: "Gleiten, ruhiger",
    note: "Derselbe auf der Feder einer wandernden Marke (320ms).",
  },
  {
    pace: "none",
    name: "Springen",
    note: "Ein runder Halo, der sofort auf dem nächsten Feld steht.",
  },
];

/** #15: how the halo goes from slot to slot. Type a code into each. */
export const CodeHalo: Story = {
  name: "Codefeld: Halo",
  render: () => (
    <Board>
      {paces.map((option) => (
        <Option key={option.pace} name={option.name} note={option.note}>
          <OtpHaloPaceContext value={option.pace}>
            <Field>
              <FieldLabel>Bestätigungscode ({option.name})</FieldLabel>
              <OtpField />
              <FieldDescription>
                Wir haben ihn an die Nummer mit der Endung 42 gesendet.
              </FieldDescription>
            </Field>
          </OtpHaloPaceContext>
        </Option>
      ))}
    </Board>
  ),
};
