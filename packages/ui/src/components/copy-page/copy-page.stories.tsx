import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor } from "storybook/test";

import { BreadcrumbItem, BreadcrumbLink, Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs";
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
