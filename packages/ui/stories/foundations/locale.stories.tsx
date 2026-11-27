import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, screen, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
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
      await expect(dialog.querySelector('[aria-label="Close"]')).toBeVisible();
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
      await expect(canvas.getByRole("button", { name: "Clear search" })).toBeVisible();
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
      await expect(dialog.querySelector('[aria-label="Schließen"]')).toBeVisible();
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
      await expect(canvas.getByRole("button", { name: "Suche leeren" })).toBeVisible();
    });
  },
};
