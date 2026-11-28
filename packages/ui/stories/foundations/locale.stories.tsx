import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, screen, waitFor } from "storybook/test";

import { AnchorHeading } from "@/components/anchor-heading/anchor-heading";
import { Attachment } from "@/components/attachment/attachment";
import { BreadcrumbItem, BreadcrumbLink, Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs";
import { Bullet } from "@/components/bullet/bullet";
import { Button } from "@/components/button/button";
import { Chip } from "@/components/chip/chip";
import { CodeBlock } from "@/components/code-block/code-block";
import { CopyButton } from "@/components/copy-button/copy-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog/dialog";
import { FileThumbStack } from "@/components/file-thumb/file-thumb-stack";
import { Funnel } from "@/components/funnel/funnel";
import { Pager, PagerLink } from "@/components/pager/pager";
import { Pagination } from "@/components/pagination/pagination";
import { SearchField } from "@/components/search-field/search-field";
import { Tracker, type TrackerItem } from "@/components/tracker/tracker";
import { LocaleProvider } from "@/locale/locale";

const meta = {
  title: "Foundations/Locale",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 860, height: 760 }, clip: "viewport" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The words that are the caller's own: every other word on the board is the library's. */
type Copy = {
  search: string;
  searchHint: string;
  results: string;
  link: string;
  service: string;
  uptime: string;
  tracker: string;
  quiet: string;
  outage: string;
  dialogTitle: string;
  dialogText: string;
  cancel: string;
  send: string;
};

const english: Copy = {
  search: "Search quotes",
  searchHint: "Search in quotes",
  results: "Quotes, compact",
  link: "https://portal.lanfermann.dev/invite/7f3k-92qa",
  service: "Quote service",
  uptime: "99.8% available",
  tracker: "Availability of the quote service, last 30 days",
  quiet: "No incident",
  outage: "Down for 2 hours 10 minutes",
  dialogTitle: "Send quote.",
  dialogText: "The customer receives the quote as a PDF by email.",
  cancel: "Cancel",
  send: "Send",
};

const german: Copy = {
  search: "Angebote suchen",
  searchHint: "In Angeboten suchen",
  results: "Angebote, kompakt",
  link: "https://portal.lanfermann.dev/einladung/7f3k-92qa",
  service: "Angebotsdienst",
  uptime: "99,8 % verfügbar",
  tracker: "Verfügbarkeit des Angebotsdienstes, letzte 30 Tage",
  quiet: "Keine Störung",
  outage: "2 Stunden 10 Minuten ausgefallen",
  dialogTitle: "Angebot senden.",
  dialogText: "Die Kundin erhält das Angebot als PDF per E-Mail.",
  cancel: "Abbrechen",
  send: "Senden",
};

/** Thirty days that end on 20 November 2026, with one outage eight days before the end. */
function days(copy: Copy): TrackerItem[] {
  return Array.from({ length: 30 }, (_, index) => {
    // Day 22 of October and on: a day past the month's end rolls over into November.
    const date = new Date(Date.UTC(2026, 9, 22 + index)).toISOString().slice(0, 10);
    return index === 21
      ? { date, status: "danger", detail: copy.outage }
      : { date, status: "success", detail: copy.quiet };
  });
}

/**
 * A handful of parts with no label of their own: the pages, a search, a key that copies, a
 * strip of days and an open dialog. Whatever they say here comes from the locale.
 */
function Parts({ copy }: { copy: Copy }) {
  const [page, setPage] = useState(2);
  const [query, setQuery] = useState("");
  return (
    <div className="flex min-h-[760px] flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Pagination page={page} pages={12} onPageChange={setPage} />
        <Pagination
          variant="compact"
          aria-label={copy.results}
          page={page}
          pages={12}
          onPageChange={setPage}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <SearchField
          aria-label={copy.search}
          placeholder={copy.searchHint}
          value={query}
          onValueChange={setQuery}
          className="w-72"
        />
        <div className="flex min-w-0 items-center gap-1">
          <code className="min-w-0 truncate font-mono text-sm text-fg-body">{copy.link}</code>
          <CopyButton text={copy.link} size="sm" />
        </div>
      </div>
      <div className="flex max-w-full flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-control font-medium text-fg">{copy.service}</p>
          <p className="text-sm text-fg-muted tabular-nums">{copy.uptime}</p>
        </div>
        <Tracker label={copy.tracker} data={days(copy)} />
      </div>
      <Dialog defaultOpen modal={false}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.dialogTitle}</DialogTitle>
            <DialogDescription>{copy.dialogText}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="quiet" />}>{copy.cancel}</DialogClose>
            <DialogClose render={<Button variant="primary" />}>{copy.send}</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * The English specimen: the same parts as everywhere else, under a `LocaleProvider` with
 * `locale="en"`. No part here was handed a label; the page numbers, "Page 2 of 12", the keys'
 * names and the dialog's "Close" are the library's own English, and the dates follow `en-US`.
 * The sample copy is English too, which it is nowhere else in the workshop.
 */
export const English: Story = {
  render: () => (
    <LocaleProvider locale="en">
      <Parts copy={english} />
    </LocaleProvider>
  ),
};

/** The names the parts give themselves in English, as a test. */
export const EnglishNames: Story = {
  render: () => (
    <LocaleProvider locale="en">
      <Parts copy={english} />
    </LocaleProvider>
  ),
  play: async ({ canvas, userEvent, step }) => {
    await step("the dialog's way out is called Close", async () => {
      const dialog = await screen.findByRole("dialog", { name: "Send quote." });
      // The sheet fades in: its key is there at once, and seen a moment later.
      await waitFor(() => expect(dialog.querySelector('[aria-label="Close"]')).toBeVisible());
      await expect(dialog.querySelector('[aria-label="Schließen"]')).toBeNull();
    });

    await step("the pages and their arrows are named in English", async () => {
      const nav = canvas.getByRole("navigation", { name: "Pages" });
      await expect(nav.querySelector('[aria-current="page"]')).toHaveAccessibleName("Page 2");
      await expect(canvas.getAllByRole("button", { name: "Previous page" })).toHaveLength(2);
      await expect(canvas.getAllByRole("button", { name: "Next page" })).toHaveLength(2);
      await expect(canvas.getByText("Page 2 of 12")).toBeVisible();
    });

    await step("the key that copies is called Copy", async () => {
      await expect(canvas.getByRole("button", { name: "Copy" })).toBeVisible();
    });

    await step("the strip of days writes its dates the American way", async () => {
      const strip = canvas.getByRole("group", { name: /Availability of the quote service/ });
      await expect(strip).toHaveAttribute("aria-roledescription", "History");
      await expect(strip).toHaveAccessibleName(/Use the arrow keys to move through the entries\.$/);
      strip.focus();
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() =>
        expect(document.querySelector('[data-slot="chart-readout"]')).toHaveTextContent(
          "Fri, Nov 20",
        ),
      );
      await userEvent.keyboard("{Escape}");
    });

    await step("once something is typed, the cross is called Clear search", async () => {
      await userEvent.type(canvas.getByRole("searchbox", { name: "Search quotes" }), "hu");
      // The cross eases in once there is text to clear.
      await waitFor(() =>
        expect(canvas.getByRole("button", { name: "Clear search" })).toBeVisible(),
      );
    });
  },
};

/**
 * The same parts without a provider, as a test: everything is German, word for word as before
 * there was a locale.
 */
export const GermanWithoutProvider: Story = {
  render: () => <Parts copy={german} />,
  play: async ({ canvas, userEvent, step }) => {
    await step("the dialog's way out is called Schließen", async () => {
      const dialog = await screen.findByRole("dialog", { name: "Angebot senden." });
      await waitFor(() => expect(dialog.querySelector('[aria-label="Schließen"]')).toBeVisible());
      await expect(dialog.querySelector('[aria-label="Close"]')).toBeNull();
    });

    await step("the pages and their arrows are named in German", async () => {
      const nav = canvas.getByRole("navigation", { name: "Seiten" });
      await expect(nav.querySelector('[aria-current="page"]')).toHaveAccessibleName("Seite 2");
      await expect(canvas.getAllByRole("button", { name: "Vorherige Seite" })).toHaveLength(2);
      await expect(canvas.getAllByRole("button", { name: "Nächste Seite" })).toHaveLength(2);
      await expect(canvas.getByText("Seite 2 von 12")).toBeVisible();
    });

    await step("the key that copies is called Kopieren", async () => {
      await expect(canvas.getByRole("button", { name: "Kopieren" })).toBeVisible();
    });

    await step("the strip of days writes its dates the German way", async () => {
      const strip = canvas.getByRole("group", { name: /Verfügbarkeit des Angebotsdienstes/ });
      await expect(strip).toHaveAttribute("aria-roledescription", "Verlauf");
      await expect(strip).toHaveAccessibleName(/Mit den Pfeiltasten durch die Einträge gehen\.$/);
      strip.focus();
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() =>
        expect(document.querySelector('[data-slot="chart-readout"]')).toHaveTextContent(
          "Fr., 20. Nov.",
        ),
      );
      await userEvent.keyboard("{Escape}");
    });

    await step("once something is typed, the cross is called Suche leeren", async () => {
      await userEvent.type(canvas.getByRole("searchbox", { name: "Angebote suchen" }), "hu");
      // The cross eases in once there is text to clear.
      await waitFor(() =>
        expect(canvas.getByRole("button", { name: "Suche leeren" })).toBeVisible(),
      );
    });
  },
};

/** The words of the plain parts that are the caller's own. */
type PlainCopy = {
  docs: string;
  guides: string;
  section: string;
  state: string;
  before: string;
  after: string;
  goals: string;
  goal: string;
  flow: string;
  written: string;
  sent: string;
  chipFile: string;
  tileFile: string;
  /** A file whose key was given a verb by the caller, which is said after its name. */
  ownFile: string;
  ownVerb: string;
  stack: [string, string, string];
};

const plainEnglish: PlainCopy = {
  docs: "Docs",
  guides: "Guides",
  section: "Sending a quote",
  state: "Paid",
  before: "Writing a quote",
  after: "Reminders",
  goals: "Goals in November",
  goal: "Revenue in November",
  flow: "Quotes in November",
  written: "Quotes written",
  sent: "Quotes sent",
  chipFile: "report.pdf",
  tileFile: "floor-plan.pdf",
  ownFile: "invoice-0042.pdf",
  ownVerb: "delete",
  stack: ["quote.pdf", "invoice.pdf", "notes.txt"],
};

const plainGerman: PlainCopy = {
  docs: "Doku",
  guides: "Anleitungen",
  section: "Ein Angebot senden",
  state: "Bezahlt",
  before: "Ein Angebot schreiben",
  after: "Erinnerungen",
  goals: "Ziele im November",
  goal: "Umsatz im November",
  flow: "Angebote im November",
  written: "Angebote geschrieben",
  sent: "Angebote gesendet",
  chipFile: "Angebot-Kornprobst.pdf",
  tileFile: "Grundriss.pdf",
  ownFile: "Rechnung-0042.pdf",
  ownVerb: "löschen",
  stack: ["Angebot.pdf", "Rechnung.pdf", "Notizen.txt"],
};

const euros: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
};

/**
 * The parts that are plain markup and may be drawn on the server: a heading with its link, a
 * trail, a chip, the way on, a stack of files, a change in code, goals and a flow; and a file
 * with its remove key. None was handed a label or a locale. Their default names are text of
 * the table (an attribute could not follow the provider), and their figures are written by it.
 */
function PlainParts({ copy }: { copy: PlainCopy }) {
  return (
    <div className="flex max-w-2xl flex-col gap-6 p-8">
      <Breadcrumbs>
        <BreadcrumbItem>
          <BreadcrumbLink href="#docs">{copy.docs}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="#guides">{copy.guides}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumbs>
      <AnchorHeading id="section">{copy.section}</AnchorHeading>
      <div className="flex flex-wrap items-center gap-4">
        <Chip onRemove={() => {}}>{copy.state}</Chip>
        <Attachment variant="chip" name={copy.chipFile} size={248_000} onRemove={() => {}} />
        <Attachment
          variant="chip"
          name={copy.ownFile}
          size={248_000}
          onRemove={() => {}}
          removeLabel={copy.ownVerb}
        />
        <Attachment variant="tile" name={copy.tileFile} size={1_240_000} onRemove={() => {}} />
        <FileThumbStack
          files={copy.stack.map((name) => ({ name, kind: name.endsWith(".pdf") ? "pdf" : "file" }))}
        />
      </div>
      <CodeBlock
        language="ts"
        code={"const rate = 0.19;\nconst rate = 0.07;\nexport { rate };"}
        removed={1}
        added={2}
      />
      <Bullet
        aria-label={copy.goals}
        format={euros}
        data={[{ name: copy.goal, value: 38_400, target: 50_000 }]}
      />
      <Funnel
        aria-label={copy.flow}
        data={[
          { name: copy.written, value: 1240 },
          { name: copy.sent, value: 1054 },
        ]}
      />
      <Pager>
        <PagerLink direction="previous" href="#before" title={copy.before} />
        <PagerLink direction="next" href="#after" title={copy.after} />
      </Pager>
    </div>
  );
}

/** What a changed line's sign is read out as: the second half of the generated content. */
function signWord(canvasElement: HTMLElement, kind: "added" | "removed"): string {
  const line = canvasElement.querySelector(`[data-slot="code-block-line"][data-kind="${kind}"]`);
  return line ? getComputedStyle(line, "::after").content : "";
}

/**
 * The plain parts in English: the way on says "Previous page" and "Next page", the goals read
 * "€38,400 of €50,000 · 77% of target" and the flow counts "1,240". What only assistive tech
 * hears (the names of the trail, the keys and the stack) is checked in the test below.
 */
export const EnglishPlain: Story = {
  parameters: { visual: { viewport: { width: 860, height: 720 } } },
  render: () => (
    <LocaleProvider locale="en">
      <PlainParts copy={plainEnglish} />
    </LocaleProvider>
  ),
};

/**
 * The plain parts under `locale="en"`, as a test: each names itself in English and writes its
 * figures the American way, though none of them reads the provider itself.
 */
export const EnglishPlainParts: Story = {
  ...EnglishPlain,
  play: async ({ canvas, canvasElement, step }) => {
    await step("the trail, the way on and their links are named in English", async () => {
      await expect(canvas.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
      const pager = canvas.getByRole("navigation", { name: "More pages" });
      await expect(pager).toBeVisible();
      await expect(
        canvas.getByRole("link", { name: "Previous page Writing a quote" }),
      ).toBeVisible();
      await expect(canvas.getByRole("link", { name: "Next page Reminders" })).toBeVisible();
    });

    await step("the heading's link is called Link to this section", async () => {
      await expect(canvas.getByRole("link", { name: "Link to this section" })).toHaveAttribute(
        "href",
        "#section",
      );
    });

    await step("the keys that take something away say what", async () => {
      await expect(canvas.getByRole("button", { name: "Paid Remove" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Remove report.pdf" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Remove floor-plan.pdf" })).toBeVisible();
      // A verb of the caller's keeps its place after what the chip says.
      await expect(
        canvas.getByRole("button", { name: "invoice-0042.pdf 248 KB delete" }),
      ).toBeVisible();
      await expect(canvas.queryByRole("button", { name: /entfernen/i })).toBeNull();
    });

    await step("the stack counts its files in English", async () => {
      await expect(canvas.getByRole("img", { name: "3 files" })).toBeVisible();
    });

    await step("a changed line's sign is read as added or removed", async () => {
      await expect(signWord(canvasElement, "added")).toContain('"added"');
      await expect(signWord(canvasElement, "removed")).toContain('"removed"');
    });

    await step("the goals and the flow write their figures the American way", async () => {
      const goals = canvas.getByRole("list", { name: "Goals in November" });
      await expect(goals).toHaveTextContent("€38,400 of €50,000 · 77% of target");
      const flow = canvas.getByRole("list", { name: "Quotes in November" });
      await expect(flow).toHaveTextContent("1,240");
      await expect(flow).toHaveTextContent("85% of the previous step");
    });
  },
};

/**
 * The same plain parts without a provider, as a test: named and written in German, word for
 * word as before they followed a locale.
 */
export const GermanPlainParts: Story = {
  parameters: { visual: { viewport: { width: 860, height: 720 } } },
  render: () => <PlainParts copy={plainGerman} />,
  play: async ({ canvas, canvasElement, step }) => {
    await step("the trail, the way on and their links are named in German", async () => {
      await expect(canvas.getByRole("navigation", { name: "Pfad" })).toBeVisible();
      await expect(canvas.getByRole("navigation", { name: "Weitere Seiten" })).toBeVisible();
      await expect(
        canvas.getByRole("link", { name: "Vorherige Seite Ein Angebot schreiben" }),
      ).toBeVisible();
      await expect(canvas.getByRole("link", { name: "Nächste Seite Erinnerungen" })).toBeVisible();
    });

    await step("the heading's link is called Link zu diesem Abschnitt", async () => {
      await expect(canvas.getByRole("link", { name: "Link zu diesem Abschnitt" })).toHaveAttribute(
        "href",
        "#section",
      );
    });

    await step("the keys that take something away say the name, then the verb", async () => {
      await expect(canvas.getByRole("button", { name: "Bezahlt Entfernen" })).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: "Angebot-Kornprobst.pdf 248 KB entfernen" }),
      ).toBeVisible();
      // The table's sentence reads as a verb of the caller's does, which is how the name was
      // put together before: what the chip says, then the verb.
      await expect(
        canvas.getByRole("button", { name: "Rechnung-0042.pdf 248 KB löschen" }),
      ).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Grundriss.pdf entfernen" })).toBeVisible();
    });

    await step("the stack counts its files in German", async () => {
      await expect(canvas.getByRole("img", { name: "3 Dateien" })).toBeVisible();
    });

    await step("a changed line's sign is read as hinzugefügt or entfernt", async () => {
      await expect(signWord(canvasElement, "added")).toContain('"hinzugefügt"');
      await expect(signWord(canvasElement, "removed")).toContain('"entfernt"');
    });

    await step("the goals and the flow write their figures the German way", async () => {
      const goals = canvas.getByRole("list", { name: "Ziele im November" });
      await expect(goals).toHaveTextContent("38.400 € von 50.000 € · 77 % vom Ziel");
      const flow = canvas.getByRole("list", { name: "Angebote im November" });
      await expect(flow).toHaveTextContent("1.240");
      await expect(flow).toHaveTextContent("85 % vom Schritt davor");
    });
  },
};
