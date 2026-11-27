import { Delete02Icon, Download01Icon, SentIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect, useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Card } from "@/components/card/card";
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
import { toast, Toaster } from "@/components/toast/toast";

import { ActionBar, ActionBarButton, type ActionBarProps } from "./action-bar";

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
  /** What the bar is cut from: the dark sheet (the default) or the light one. */
  ground?: ActionBarProps["ground"];
};

/**
 * A list of quotes whose rows can be ticked. The table needs nothing of its own for this: a
 * `Checkbox` per row, one in the head that stands for all of them, and the selection in state.
 */
function Selection({ start = [], narrow = false, ground }: SelectionProps) {
  const [selected, setSelected] = useState<readonly string[]>(start);
  const all = selected.length === QUOTES.length;
  const toggle = (id: string) =>
    setSelected((now) => (now.includes(id) ? now.filter((each) => each !== id) : [...now, id]));

  return (
    // The bar stands at the foot of this box, as it stands at the foot of the window in an app.
    <div className="relative h-dvh overflow-hidden p-6">
      <Card>
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
      </Card>
      <ActionBar
        position="absolute"
        ground={ground}
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

/**
 * `ground="paper"`: the bar as a light sheet. It is the one to take over a dark section of a
 * light page, where the dark sheet would be dark on dark; look at it on the Ink ground. In dark
 * mode it is the same as the default: both grounds are a sheet of the page there.
 */
export const Light: Story = {
  render: () => <Selection start={["2026-0421", "2026-0418"]} ground="paper" />,
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

/** A toast that tells of the last thing done, there from the start and until it is dismissed. */
function Told({ children }: { children: ReactNode }) {
  useEffect(() => {
    toast({
      id: "told",
      title: "Angebot gelöscht.",
      description: "Elektro Wagner, 2026-0397",
      timeout: 0,
      action: { label: "Rückgängig", onClick: () => undefined },
    });
    return () => toast.dismiss();
  }, []);
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

/**
 * A toast shows while rows are ticked: it stands above the bar, 12px clear of it, and never on
 * the bar's last action. Tick the first row and both rise together.
 */
export const WithToast: Story = {
  parameters: {
    visual: {
      target: third,
      motion: [{ name: "lift", click: third, frames: 8 }],
    },
  },
  render: () => (
    <Told>
      <Selection />
    </Told>
  ),
};

/** The same with rows already ticked: the toast above the bar. */
export const ToastAbove: Story = {
  render: () => (
    <Told>
      <Selection start={["2026-0421", "2026-0418"]} />
    </Told>
  ),
};

/**
 * In a wide window the bar ends before the toasts' column: the toast stays in its corner, beside
 * the bar, since nothing is in its way.
 */
export const ToastBeside: Story = {
  parameters: { visual: { viewport: { width: 1440, height: 400 } } },
  render: () => (
    <Told>
      <Selection start={["2026-0421", "2026-0418"]} />
    </Told>
  ),
};

/**
 * As a test: the toasts' stack rises when the bar comes under it and comes back down when the
 * bar leaves; the bar says how much room it takes on the page's root, and takes that back.
 */
export const LiftsToasts: Story = {
  render: () => (
    <Told>
      <Selection />
    </Told>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const root = document.documentElement;
    const stack = () => document.querySelector<HTMLElement>('[data-slot="toast-viewport"]')!;
    const lifted = () => new DOMMatrixReadOnly(getComputedStyle(stack()).transform).m42;
    const translate = () => getComputedStyle(stack()).translate;
    const box = canvas.getByRole("checkbox", { name: "Angebot für Elektro Wagner auswählen" });

    await step("without a bar the stack stands in its corner", async () => {
      await waitFor(() => expect(stack()).toBeInTheDocument());
      await expect(root.style.getPropertyValue("--toaster-lift")).toBe("");
      await expect(lifted()).toBe(0);
    });

    await step("the bar comes: the stack stands 12px above it", async () => {
      await userEvent.click(box);
      const bar = await canvas.findByRole("toolbar", { name: "Auswahl" });
      await waitFor(() => expect(root.style.getPropertyValue("--toaster-lift")).not.toBe(""));
      await waitFor(
        async () => {
          const gap = bar.getBoundingClientRect().top - stack().getBoundingClientRect().bottom;
          await expect(Math.round(gap)).toBe(12);
        },
        { timeout: 2000 },
      );
      await expect(translate()).not.toBe("none");
    });

    await step("the bar leaves: the stack comes back down", async () => {
      await userEvent.click(box);
      await waitFor(() => expect(root.style.getPropertyValue("--toaster-lift")).toBe(""));
    });
  },
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
