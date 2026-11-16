import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { expect, screen, waitFor } from "storybook/test";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { Badge } from "@/components/badge/badge";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

const meta = {
  title: "Components/HoverCard",
  component: HoverCard,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 560, height: 120 },
      target: '[data-slot="hover-card-trigger"]',
      motion: [{ name: "open", hover: '[data-slot="hover-card-trigger"]', frames: 8 }],
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

type PageProps = Pick<ComponentProps<typeof HoverCard>, "defaultOpen"> &
  Pick<ComponentProps<typeof HoverCardContent>, "side"> & {
    /** How long the link waits before the card opens, in ms. */
    delay?: number;
  };

/** A term in running text, and the page of the docs it leads to. */
function PagePreview({ defaultOpen, side, delay }: PageProps) {
  return (
    <p className="max-w-[30rem] text-base text-fg-body">
      Für ein Team auf einem Server lies{" "}
      <HoverCard defaultOpen={defaultOpen}>
        <HoverCardTrigger href="#fernzugriff" delay={delay}>
          Fernzugriff
        </HoverCardTrigger>
        <HoverCardContent side={side}>
          <p className="text-sm text-fg-muted">Anleitungen</p>
          <p className="text-base leading-snug font-semibold text-fg">Fernzugriff</p>
          <p>
            Den Server einmal für alle betreiben: mit Anmeldung über OAuth, einem Token je Benutzer
            und einem Protokoll, wer was abgefragt hat.
          </p>
        </HoverCardContent>
      </HoverCard>
      . Diese Seite hier richtet ihn auf deinem eigenen Rechner ein.
    </p>
  );
}

/** At rest it is a link like any other. */
export const Default: Story = {
  render: () => <PagePreview />,
};

/** Pointed at, the card grows out of the link and hangs from its start. */
export const Open: Story = {
  parameters: { visual: { viewport: { width: 560, height: 260 }, clip: "viewport" } },
  render: () => <PagePreview defaultOpen />,
};

/** Above the link, where there is no room below it. */
export const Above: Story = {
  parameters: { visual: { viewport: { width: 560, height: 260 }, clip: "viewport" } },
  render: () => (
    <div className="flex min-h-[220px] items-end">
      <PagePreview defaultOpen side="top" />
    </div>
  ),
};

/** Who stands behind a name: a few facts that the customer's own page holds as well. */
export const Customer: Story = {
  parameters: { visual: { viewport: { width: 560, height: 260 }, clip: "viewport" } },
  render: () => (
    <p className="max-w-[30rem] text-base text-fg-body">
      Das Angebot A-2026-041 ging am 12.11. an{" "}
      <HoverCard defaultOpen>
        <HoverCardTrigger href="#kunde">Schreinerei Huber</HoverCardTrigger>
        <HoverCardContent className="gap-3">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>SH</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="text-base leading-snug font-semibold text-fg">
                Schreinerei Huber
              </span>
              <span className="text-sm text-fg-muted">Rosenheim · Kunde seit 2024</span>
            </div>
          </div>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-hairline pt-3">
            <dt>Offene Angebote</dt>
            <dd className="text-fg tabular-nums">2</dd>
            <dt>Letzte Rechnung</dt>
            <dd>
              <Badge tone="success">Bezahlt</Badge>
            </dd>
          </dl>
        </HoverCardContent>
      </HoverCard>
      .
    </p>
  ),
};

/**
 * The keyboard, as a test: the link is the tab stop and stays a link. With the keyboard on it
 * the card shows, and Escape puts it away while the focus stays on the link.
 */
export const Keyboard: Story = {
  render: () => <PagePreview delay={0} />,
  play: async ({ canvas, userEvent, step }) => {
    const link = canvas.getByRole("link", { name: "Fernzugriff" });

    await step("The link is the tab stop, and it leads somewhere", async () => {
      await userEvent.tab();
      await expect(link).toHaveFocus();
      await expect(link).toHaveAttribute("href", "#fernzugriff");
    });

    await step("With the keyboard on it, the card shows", async () => {
      await waitFor(() => expect(screen.getByText("Anleitungen")).toBeVisible());
    });

    await step("Escape puts it away, and the focus stays on the link", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByText("Anleitungen")).not.toBeInTheDocument());
      await expect(link).toHaveFocus();
    });
  },
};
