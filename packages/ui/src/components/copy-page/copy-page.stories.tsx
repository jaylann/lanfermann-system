import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, screen, spyOn, waitFor } from "storybook/test";

import { BreadcrumbItem, BreadcrumbLink, Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs";
import { Button } from "@/components/button/button";
import { Heading } from "@/components/heading/heading";

import { CopyPage } from "./copy-page";

/** A page's Markdown, inline, so the copy works without a server. */
const markdown = `data:text/markdown;charset=utf-8,${encodeURIComponent(
  "# Schnellstart\n\nIn zehn Minuten liest dein Modell deine Belege.\n",
)}`;

const texts = {
  label: "Seite kopieren",
  description: "Als Markdown, für eine KI",
  viewLabel: "Als Markdown ansehen",
  viewDescription: "Die Seite als reiner Text",
  moreLabel: "Markdown-Optionen",
  copied: "Die Seite wurde kopiert.",
  failed: "Die Seite wurde nicht kopiert. Bitte versuche es noch einmal.",
};

const meta = {
  title: "Components/CopyPage",
  component: CopyPage,
  args: { href: markdown, ...texts },
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 720, height: 340 },
      target: '[data-slot="copy-page-copy"]',
      motion: [
        { name: "copy", click: '[data-slot="copy-page-copy"]', frames: 8 },
        { name: "open", click: '[data-slot="copy-page-more"]', frames: 8 },
      ],
    },
  },
  render: (args) => (
    <div className="flex w-[min(44rem,100%)] flex-col items-start gap-5">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Breadcrumbs>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Doku</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>Anleitungen</BreadcrumbItem>
        </Breadcrumbs>
        <CopyPage {...args} />
      </div>
      <Heading level={1}>Schnellstart</Heading>
    </div>
  ),
} satisfies Meta<typeof CopyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** In a docs page's header: at the end of the row above the title. */
export const Default: Story = {};

/** The menu: the copy again, with what it is, and the Markdown to look at. */
export const Open: Story = { args: { defaultOpen: true } };

/**
 * Tab reaches the copy, then the menu. Enter copies and the key confirms it; on the menu, Enter
 * opens it on its first row, and Escape closes it again with the focus back on the chevron.
 */
export const Keyboard: Story = {
  play: async ({ canvas, userEvent, step }) => {
    const copy = canvas.getByRole("button", { name: texts.label });
    const more = canvas.getByRole("button", { name: texts.moreLabel });

    await step("Tab reaches the copy first, then the menu", async () => {
      await userEvent.tab();
      await userEvent.tab();
      await expect(copy).toHaveFocus();
      await userEvent.tab();
      await expect(more).toHaveFocus();
    });

    await step("Enter opens the menu on its first row", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(screen.getByRole("menuitem", { name: /Seite kopieren/ })).toHaveFocus(),
      );
      await expect(screen.getByRole("menuitem", { name: /Als Markdown ansehen/ })).toHaveAttribute(
        "href",
        markdown,
      );
    });

    await step("Escape closes it, and the focus is back on the chevron", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(more).toHaveFocus());
    });
  },
};

/**
 * A clipboard that writes nowhere and says what it was given, by whichever of its two ways the
 * browser takes, and a server that answers `pages` under `/doku/`.
 */
function watchCopy(pages: (address: string) => Promise<Response>) {
  const written: string[] = [];
  const writeText = spyOn(navigator.clipboard, "writeText").mockImplementation((text) => {
    written.push(text);
    return Promise.resolve();
  });
  const write =
    typeof navigator.clipboard.write === "function"
      ? spyOn(navigator.clipboard, "write").mockImplementation(async (items) => {
          const blob = await items[0]!.getType("text/plain");
          written.push(await blob.text());
        })
      : undefined;
  const real = window.fetch.bind(window);
  const fetched = spyOn(window, "fetch").mockImplementation((input, init) =>
    typeof input === "string" && input.startsWith("/doku/") ? pages(input) : real(input, init),
  );
  return {
    written,
    fetched,
    restore: () => {
      writeText.mockRestore();
      write?.mockRestore();
      fetched.mockRestore();
    },
  };
}

/**
 * A layout that stays while the page under it changes, as a test: the copy takes the page that
 * is shown now, not the one the pointer first reached the fitting on.
 */
export const PageChange: Story = {
  render: function Render(args) {
    const [page, setPage] = useState("schnellstart");
    return (
      <div className="flex items-center gap-3">
        <Button onClick={() => setPage("einrichten")}>Nächste Seite</Button>
        <CopyPage {...args} href={`/doku/${page}.md`} />
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const watch = watchCopy((address) => Promise.resolve(new Response(`# ${address}`)));
    try {
      const copy = canvas.getByRole("button", { name: texts.label });
      await userEvent.hover(copy);
      await waitFor(() => expect(watch.fetched).toHaveBeenCalledWith("/doku/schnellstart.md"));
      await userEvent.click(canvas.getByRole("button", { name: "Nächste Seite" }));
      await userEvent.click(copy);
      await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent(texts.copied));
      await expect(watch.written).toEqual(["# /doku/einrichten.md"]);
    } finally {
      watch.restore();
    }
  },
};

/**
 * The fetch ahead of the press fails, as a test: it is forgotten, so the press that follows
 * fetches the page again and copies it.
 */
export const FetchAgain: Story = {
  args: { href: "/doku/schnellstart.md" },
  play: async ({ canvas, userEvent }) => {
    let calls = 0;
    const watch = watchCopy(() =>
      calls++ === 0
        ? Promise.reject(new TypeError("offline"))
        : Promise.resolve(new Response("# Schnellstart")),
    );
    try {
      const copy = canvas.getByRole("button", { name: texts.label });
      await userEvent.hover(copy);
      await waitFor(() => expect(watch.fetched).toHaveBeenCalledOnce());
      await userEvent.click(copy);
      await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent(texts.copied));
      await expect(watch.written).toEqual(["# Schnellstart"]);
    } finally {
      watch.restore();
    }
  },
};
