import { CloudIcon, CreditCardIcon, GithubIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Badge } from "@/components/badge/badge";
import { Card, CardBar, CardFooter } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { IconTile } from "@/components/icon-tile/icon-tile";
import { Link } from "@/components/link/link";

import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "./accordion";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: { visual: { viewport: { width: 600, height: 420 } } },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

function Questions() {
  return (
    <>
      <AccordionItem value="preis">
        <AccordionTrigger>Was kostet eine Website?</AccordionTrigger>
        <AccordionPanel>
          Eine Seite für einen Handwerksbetrieb kostet einmalig 2.780 €. Darin sind Texte, Fotos vom
          Betrieb und das Google-Profil enthalten.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="dauer">
        <AccordionTrigger>Wie lange dauert es, bis die Seite online ist?</AccordionTrigger>
        <AccordionPanel>
          In der Regel vier Wochen nach dem ersten Gespräch. Den Termin legen wir gemeinsam fest und
          halten ihn im <Link href="#angebot">Angebot</Link> fest.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="pflege">
        <AccordionTrigger>Kann ich Texte und Fotos später selbst ändern?</AccordionTrigger>
        <AccordionPanel>
          Ja. Öffnungszeiten, Preise und Bilder ändern Sie selbst. Für alles andere genügt eine
          E-Mail.
        </AccordionPanel>
      </AccordionItem>
    </>
  );
}

/**
 * One answer at a time. Hairlines open the block and divide the rows. The row under the pointer
 * is washed and the lines beside it step aside. An open row rests unmarked; pointed at, its
 * question's wash squares its lower corners and runs on, fainter, behind the answer. The chevron
 * turns, the answer grows to its height and unfolds.
 */
export const Default: Story = {
  parameters: {
    visual: {
      target: '[data-slot="accordion-item"]:nth-child(2) [data-slot="accordion-trigger"]',
      motion: [
        {
          name: "point",
          hover: '[data-slot="accordion-item"]:nth-child(3) [data-slot="accordion-trigger"]',
          frames: 4,
        },
        {
          name: "point-open",
          hover: '[data-slot="accordion-item"]:nth-child(1) [data-slot="accordion-trigger"]',
          frames: 4,
        },
        {
          name: "open",
          click: '[data-slot="accordion-item"]:nth-child(2) [data-slot="accordion-trigger"]',
          frames: 8,
        },
        {
          name: "close",
          click: '[data-slot="accordion-item"]:nth-child(1) [data-slot="accordion-trigger"]',
          frames: 6,
        },
      ],
    },
  },
  render: () => (
    // A fixed height, so the block does not move on the page while its rows open and close.
    <div className="h-[260px] w-[520px] max-w-[calc(100vw-2rem)]">
      <Accordion defaultValue={["preis"]}>
        <Questions />
      </Accordion>
    </div>
  ),
};

/**
 * `quiet`: no wash under the pointer. The lines stay and only the chevron answers, darkening and
 * leaning the way it points. For a page where the accordion should recede.
 */
export const Quiet: Story = {
  parameters: {
    visual: {
      target: '[data-slot="accordion-item"]:nth-child(2) [data-slot="accordion-trigger"]',
    },
  },
  render: () => (
    <div className="h-[260px] w-[520px] max-w-[calc(100vw-2rem)]">
      <Accordion quiet defaultValue={["preis"]}>
        <Questions />
      </Accordion>
    </div>
  ),
};

/** `multiple`: several rows stay open, for sections that are read side by side. */
export const Multiple: Story = {
  render: () => (
    <Accordion
      multiple
      defaultValue={["preis", "pflege"]}
      className="w-[520px] max-w-[calc(100vw-2rem)]"
    >
      <Questions />
    </Accordion>
  ),
};

/** A row that cannot be opened yet keeps its place and goes quiet. */
export const Disabled: Story = {
  parameters: { visual: { viewport: { width: 600, height: 300 } } },
  render: () => (
    <Accordion defaultValue={["preis"]} className="w-[520px] max-w-[calc(100vw-2rem)]">
      <AccordionItem value="preis">
        <AccordionTrigger>Was kostet eine Website?</AccordionTrigger>
        <AccordionPanel>
          Eine Seite für einen Handwerksbetrieb kostet einmalig 2.780 €.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="shop" disabled>
        <AccordionTrigger>Was kostet ein Onlineshop?</AccordionTrigger>
        <AccordionPanel>Das Angebot für Shops folgt im Frühjahr.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  ),
};

/** At phone width a long question wraps and the chevron stays on its first line. */
export const Narrow: Story = {
  parameters: { visual: { viewport: { width: 390, height: 460 } } },
  render: () => (
    <Accordion defaultValue={["dauer"]} className="w-full">
      <Questions />
    </Accordion>
  ),
};

const INTEGRATIONS = [
  {
    value: "github",
    name: "GitHub",
    line: "Repositories und Deployments",
    icon: GithubIcon,
    connected: true,
    answer:
      "Verbunden als lanfermann seit dem 3. November. Neue Deployments erscheinen hier nach etwa einer Minute.",
  },
  {
    value: "zahlung",
    name: "Zahlungsdienst",
    line: "Rechnungen und Abbuchungen",
    icon: CreditCardIcon,
    connected: true,
    answer:
      "Abbuchungen laufen über das Geschäftskonto. Der Schlüssel wurde zuletzt am 12. Oktober erneuert.",
  },
  {
    value: "mail",
    name: "E-Mail-Versand",
    line: "Angebote und Erinnerungen",
    icon: Mail01Icon,
    connected: false,
    answer:
      "Ohne Zugang gehen Angebote und Erinnerungen nicht hinaus. Den Schlüssel finden Sie im Konto des Anbieters.",
  },
  {
    value: "ablage",
    name: "Dateiablage",
    line: "Bilder und Dokumente",
    icon: CloudIcon,
    connected: false,
    answer: "Hochgeladene Bilder und Dokumente liegen bis dahin nur auf diesem Server.",
  },
];

function Integrations() {
  return (
    <>
      {INTEGRATIONS.map((entry) => (
        <AccordionItem key={entry.value} value={entry.value}>
          <AccordionTrigger
            media={
              <IconTile>
                <Icon icon={entry.icon} size={20} />
              </IconTile>
            }
            description={entry.line}
            trailing={
              <Badge tone={entry.connected ? "success" : "neutral"}>
                {entry.connected ? "Verbunden" : "Nicht verbunden"}
              </Badge>
            }
          >
            {entry.name}
          </AccordionTrigger>
          <AccordionPanel>
            {entry.answer}{" "}
            <Link href={`#${entry.value}`}>
              {entry.connected ? "Zugang verwalten" : "Zugang einrichten"}
            </Link>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </>
  );
}

function IntegrationsCard() {
  return (
    <Card className="w-full">
      <CardBar>
        <Heading level={2} size="label">
          Integrationen
        </Heading>
        <Link href="#protokoll" variant="quiet" className="text-sm text-fg-muted">
          Protokoll
        </Link>
      </CardBar>
      <Accordion defaultValue={["github"]}>
        <Integrations />
      </Accordion>
      <CardFooter>Zugangsdaten werden verschlüsselt gespeichert.</CardFooter>
    </Card>
  );
}

const row = (n: number) =>
  `[data-slot="accordion-item"]:nth-child(${n}) [data-slot="accordion-trigger"]`;

/**
 * Straight in a `Card`, under a `CardBar` and over a `CardFooter`: the lines run to the card's
 * edges, the bar's line opens the block and the footer's closes it, and the text stands on the
 * card's 20px. Each row is a list row: a symbol on a plate, a name, a line under it and its
 * state before the chevron. The answer starts under the name. A wash is the whole row.
 */
export const InCard: Story = {
  parameters: {
    visual: {
      viewport: { width: 640, height: 520 },
      target: row(2),
      motion: [
        { name: "point", hover: row(3), frames: 4 },
        { name: "point-open", hover: row(1), frames: 4 },
        { name: "open", click: row(2), frames: 8 },
        { name: "close", click: row(1), frames: 6 },
      ],
    },
  },
  render: () => (
    // A fixed height, so the card does not move on the page while its rows open and close.
    <div className="h-[460px] w-[560px] max-w-[calc(100vw-2rem)]">
      <IntegrationsCard />
    </div>
  ),
};

/** On a phone the state moves under the description, so the name keeps the row's width. */
export const InCardNarrow: Story = {
  parameters: {
    visual: { viewport: { width: 390, height: 620 }, target: row(2) },
  },
  render: () => <IntegrationsCard />,
};

/**
 * Alone in a card, with plain questions: the card's edge opens and closes the block, so the
 * first row has no line above it and the last none below, and the focus ring of a row in a
 * corner follows the card's corner.
 */
export const InCardAlone: Story = {
  parameters: {
    visual: { viewport: { width: 640, height: 360 }, target: row(3) },
  },
  render: () => (
    <div className="h-[280px] w-[520px] max-w-[calc(100vw-2rem)]">
      <Card>
        <Accordion defaultValue={["preis"]}>
          <Questions />
        </Accordion>
      </Card>
    </div>
  ),
};

/**
 * The list row on a page, outside a card: the same parts between the accordion's own lines, the
 * wash 2px inside them.
 */
export const ListRows: Story = {
  parameters: {
    visual: { viewport: { width: 640, height: 440 }, target: row(2) },
  },
  render: () => (
    <div className="h-[380px] w-[520px] max-w-[calc(100vw-2rem)]">
      <Accordion defaultValue={["github"]}>
        <Integrations />
      </Accordion>
    </div>
  ),
};

/**
 * The keyboard path, as a test: every row is a Tab stop, Enter and Space open and close, opening
 * one row closes the other, and Tab walks into an open answer.
 */
export const Keyboard: Story = {
  render: Default.render,
  play: async ({ canvas, userEvent, step }) => {
    const row = (name: RegExp) => canvas.getByRole("button", { name });

    await step("Tab lands on the first row, which is open", async () => {
      await userEvent.tab();
      await expect(row(/Was kostet/)).toHaveFocus();
      await expect(row(/Was kostet/)).toHaveAttribute("aria-expanded", "true");
    });

    await step("Tab moves to the next row, Enter opens it and closes the first", async () => {
      await userEvent.tab();
      await expect(row(/Wie lange/)).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(row(/Wie lange/)).toHaveAttribute("aria-expanded", "true");
      await expect(row(/Was kostet/)).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(canvas.getByText(/In der Regel vier Wochen/)).toBeVisible());
    });

    await step("Tab walks into the open answer", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Angebot" })).toHaveFocus();
    });

    await step("Space closes the row again", async () => {
      await userEvent.tab({ shift: true });
      await userEvent.keyboard(" ");
      await expect(row(/Wie lange/)).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(canvas.queryByText(/In der Regel vier Wochen/)).toBeNull());
    });
  },
};

/**
 * The card form, as a test: the row's name is its title, its line and its state; the keyboard
 * opens it; and the text stands where the card's does (measured, not assumed).
 */
export const InCardKeyboard: Story = {
  render: InCard.render,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const button = (name: RegExp) => canvas.getByRole("button", { name });
    const left = (element: Element | null) => {
      if (element === null) throw new Error("the part is not on the page");
      return Math.round(element.getBoundingClientRect().left * 2) / 2;
    };
    const part = (selector: string) => canvasElement.querySelector(selector);

    await step("The button is named by its title, its line and its state", async () => {
      await expect(button(/GitHub\s+Repositories und Deployments\s+Verbunden/)).toBeVisible();
      await expect(button(/E-Mail-Versand.*Nicht verbunden/)).toBeVisible();
    });

    await step("The rows run to the card's edges, under the bar's one line", async () => {
      const card = part('[data-slot="card"]');
      const accordion = part('[data-slot="accordion"]');
      const bar = part('[data-slot="card-bar"]');
      const footer = part('[data-slot="card-footer"]');
      if (!card || !accordion || !bar || !footer) throw new Error("the card is incomplete");
      const [cardBox, box] = [card.getBoundingClientRect(), accordion.getBoundingClientRect()];
      await expect(box.left).toBe(cardBox.left);
      await expect(box.right).toBe(cardBox.right);
      // No line of its own above the first row or under the last: the first row starts where
      // the bar ends, and the footer starts where the last row ends.
      const rows = canvasElement.querySelectorAll('[data-slot="accordion-item"]');
      const lastRow = rows[rows.length - 1];
      await expect(part('[data-slot="accordion-trigger"]')?.getBoundingClientRect().top).toBe(
        bar.getBoundingClientRect().bottom,
      );
      await expect(lastRow?.getBoundingClientRect().bottom).toBe(
        footer.getBoundingClientRect().top,
      );
    });

    await step("The symbol stands on the bar's inset, the answer under the title", async () => {
      await expect(left(part('[data-slot="icon-tile"]'))).toBe(
        left(part('[data-slot="card-bar"] > *')),
      );
      const title = part('[data-slot="accordion-trigger-title"]');
      const answer = part('[data-slot="accordion-panel-content"]');
      if (!title || !answer) throw new Error("the open row is incomplete");
      await expect(left(title)).toBe(
        Math.round(
          (answer.getBoundingClientRect().left + parseFloat(getComputedStyle(answer).paddingLeft)) *
            2,
        ) / 2,
      );
    });

    await step("Tab passes the bar's link and lands on the first row, which is open", async () => {
      await userEvent.tab();
      await userEvent.tab();
      await expect(button(/GitHub/)).toHaveFocus();
      await expect(button(/GitHub/)).toHaveAttribute("aria-expanded", "true");
    });

    await step("Tab walks into the open answer, then to the next row", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Zugang verwalten" })).toHaveFocus();
      await userEvent.tab();
      await expect(button(/Zahlungsdienst/)).toHaveFocus();
    });

    await step("Enter opens it and closes the first; Space closes it again", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(button(/Zahlungsdienst/)).toHaveAttribute("aria-expanded", "true");
      await expect(button(/GitHub/)).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(canvas.getByText(/Abbuchungen laufen/)).toBeVisible());
      await userEvent.keyboard(" ");
      await expect(button(/Zahlungsdienst/)).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(canvas.queryByText(/Abbuchungen laufen/)).toBeNull());
    });
  },
};
