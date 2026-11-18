import { Delete02Icon, Download01Icon, SentIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Checkbox } from "@/components/checkbox/checkbox";
import { Icon } from "@/components/icon/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";

import { ActionBar, ActionBarButton } from "./action-bar";

const meta = {
  title: "Components/ActionBar",
  component: ActionBar,
  parameters: {
    layout: "fullscreen",
    visual: {
      viewport: { width: 760, height: 400 },
      clip: "viewport",
      target: '[data-slot="action-bar-button"]',
    },
  },
} satisfies Meta;

export default meta;
// The bar is driven by the selection each story keeps: no shared `args`.
type Story = StoryObj;

const QUOTES = [
  { id: "2026-0421", customer: "Schreinerei Mustermann", amount: 2780 },
  { id: "2026-0418", customer: "Bäckerei Kornprobst", amount: 4280 },
  { id: "2026-0412", customer: "Friseursalon Haarscharf", amount: 1950 },
  { id: "2026-0397", customer: "Elektro Wagner", amount: 3120 },
  { id: "2026-0391", customer: "Gärtnerei Weiß", amount: 860 },
] as const;

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

type SelectionProps = {
  /** The rows that are ticked when the story opens. */
  start?: readonly string[];
  /** A narrow window: the actions are symbols alone. */
  narrow?: boolean;
};

/**
 * A list of quotes whose rows can be ticked. The table needs nothing of its own for this: a
 * `Checkbox` per row, one in the head that stands for all of them, and the selection in state.
 */
function Selection({ start = [], narrow = false }: SelectionProps) {
  const [selected, setSelected] = useState<readonly string[]>(start);
  const all = selected.length === QUOTES.length;
  const toggle = (id: string) =>
    setSelected((now) => (now.includes(id) ? now.filter((each) => each !== id) : [...now, id]));

  return (
    // The bar stands at the foot of this box, as it stands at the foot of the window in an app.
    <div className="relative h-dvh overflow-hidden p-6">
      <Table aria-label="Angebote">
        <TableHeader>
          <TableRow>
            <TableHead className="w-0">
              <Checkbox
                aria-label="Alle Angebote auswählen"
                checked={all}
                indeterminate={selected.length > 0 && !all}
                onCheckedChange={(checked) => setSelected(checked ? QUOTES.map((q) => q.id) : [])}
              />
            </TableHead>
            <TableHead>Kunde</TableHead>
            {!narrow && <TableHead>Nummer</TableHead>}
            <TableHead numeric>Betrag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {QUOTES.map((quote) => (
            <TableRow key={quote.id} selected={selected.includes(quote.id)}>
              <TableCell className="w-0">
                <Checkbox
                  aria-label={`Angebot für ${quote.customer} auswählen`}
                  checked={selected.includes(quote.id)}
                  onCheckedChange={() => toggle(quote.id)}
                />
              </TableCell>
              <TableCell className="font-medium text-fg">{quote.customer}</TableCell>
              {!narrow && <TableCell className="font-mono text-sm">{quote.id}</TableCell>}
              <TableCell numeric>{euro.format(quote.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ActionBar
        position="absolute"
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
            <ActionBarButton iconOnly aria-label="Löschen">
              <Icon icon={Delete02Icon} size={16} />
            </ActionBarButton>
          </>
        ) : (
          <>
            <ActionBarButton>
              <Icon icon={SentIcon} size={14} />
              Senden
            </ActionBarButton>
            <ActionBarButton>
              <Icon icon={Download01Icon} size={14} />
              Als PDF herunterladen
            </ActionBarButton>
            <ActionBarButton>
              <Icon icon={Delete02Icon} size={14} />
              Löschen
            </ActionBarButton>
          </>
        )}
      </ActionBar>
    </div>
  );
}

const third = 'tbody tr:nth-child(3) [data-slot="checkbox"]';

/**
 * Two rows are ticked: the bar stands at the foot and counts them. Tick a third and the count
 * rolls to it; the cross takes the selection back, and the bar leaves.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "count", click: third, frames: 6 },
        { name: "leave", click: '[data-slot="action-bar-clear"]', frames: 6 },
      ],
    },
  },
  render: () => <Selection start={["2026-0421", "2026-0418"]} />,
};

/** Nothing is ticked yet: the bar is not there. It rises with the first row that is ticked. */
export const Rising: Story = {
  parameters: {
    visual: {
      target: third,
      motion: [{ name: "rise", click: third, frames: 8 }],
    },
  },
  render: () => <Selection />,
};

/** Ten and more: the count gains a place, and the words beside it keep still. */
export const Many: Story = {
  render: () => (
    <div className="relative h-dvh overflow-hidden p-6">
      <ActionBar position="absolute" open count={128} onClear={() => {}}>
        <ActionBarButton>
          <Icon icon={Download01Icon} size={14} />
          Als PDF herunterladen
        </ActionBarButton>
        <ActionBarButton disabled>
          <Icon icon={Delete02Icon} size={14} />
          Löschen
        </ActionBarButton>
      </ActionBar>
    </div>
  ),
  parameters: { visual: { viewport: { width: 760, height: 140 } } },
};

/** On a phone: 8px off the edges, above the home indicator, and the actions as symbols alone. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 520 } } },
  render: () => <Selection start={["2026-0421", "2026-0418", "2026-0412"]} narrow />,
};

/**
 * The keyboard path, as a test: ticking a row brings the bar without taking the focus, Tab
 * reaches it as one stop, the arrow keys move between its actions, and Escape takes the
 * selection back and returns the focus to where it came from.
 */
export const Keyboard: Story = {
  render: () => <Selection />,
  play: async ({ canvas, userEvent, step }) => {
    const row = (customer: string) =>
      canvas.getByRole("checkbox", { name: `Angebot für ${customer} auswählen` });
    const last = row("Gärtnerei Weiß");

    await step("without a selection there is no bar to reach", async () => {
      await expect(canvas.queryByRole("toolbar")).not.toBeInTheDocument();
    });

    await step("ticking a row brings the bar, and the focus stays on the row", async () => {
      last.focus();
      await userEvent.keyboard(" ");
      await expect(last).toBeChecked();
      const bar = await canvas.findByRole("toolbar", { name: "Auswahl" });
      await expect(bar).toHaveTextContent("ausgewählt");
      await expect(last).toHaveFocus();
    });

    await step("the head's box says that only some are ticked, and ticks them all", async () => {
      const head = canvas.getByRole("checkbox", { name: "Alle Angebote auswählen" });
      await expect(head).toHaveAttribute("aria-checked", "mixed");
      await userEvent.click(head);
      await expect(row("Elektro Wagner")).toBeChecked();
      await expect(canvas.getByRole("toolbar")).toHaveTextContent("5");
    });

    await step("Tab reaches the bar as one stop, and the arrows move inside it", async () => {
      last.focus();
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Senden" })).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("button", { name: "Als PDF herunterladen" })).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("button", { name: "Löschen" })).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("button", { name: "Auswahl aufheben" })).toHaveFocus();
    });

    await step("Escape takes the selection back, and the focus returns to the row", async () => {
      await userEvent.keyboard("{Escape}");
      await expect(last).not.toBeChecked();
      await expect(row("Schreinerei Mustermann")).not.toBeChecked();
      await expect(last).toHaveFocus();
      await waitFor(() => expect(canvas.queryByRole("toolbar")).not.toBeInTheDocument());
    });
  },
};
