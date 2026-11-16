import {
  Bread01Icon,
  Coins01Icon,
  DollarCircleIcon,
  EuroIcon,
  FlashIcon,
  Hammer01Icon,
  SausageIcon,
  ScissorIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor, within } from "storybook/test";

import { Field, FieldDescription, FieldLabel } from "@/components/field/field";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "./select";

const meta = {
  title: "Components/Select",
  component: Select,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 380, height: 360 }, clip: "viewport" },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const TRADES = [
  { value: "schreinerei", label: "Schreinerei" },
  { value: "baeckerei", label: "Bäckerei" },
  { value: "metzgerei", label: "Metzgerei" },
  { value: "friseur", label: "Friseursalon" },
  { value: "elektro", label: "Elektrobetrieb" },
];

function TradeSelect(props: { defaultOpen?: boolean; defaultValue?: string | null }) {
  return (
    <Field className="w-64">
      <FieldLabel nativeLabel={false} render={<div />}>
        Gewerk
      </FieldLabel>
      <Select items={TRADES} modal={false} {...props}>
        <SelectTrigger placeholder="Bitte wählen" className="w-full" />
        <SelectContent>
          {TRADES.map((trade) => (
            <SelectItem key={trade.value} value={trade.value}>
              {trade.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>Danach richten sich die Vorlagen.</FieldDescription>
    </Field>
  );
}

/** Nothing chosen yet: the placeholder stands in italics, like in an input. */
export const Default: Story = {
  parameters: {
    visual: {
      viewport: { width: 380, height: 150 },
      motion: [{ name: "open", click: '[data-slot="select-trigger"]', frames: 8 }],
    },
  },
  render: () => <TradeSelect />,
};

/** Open: the chosen option carries the disc. */
export const Open: Story = { render: () => <TradeSelect defaultOpen defaultValue="baeckerei" /> };

const TRADES_WITH_ICONS = [
  { value: "schreinerei", label: "Schreinerei", icon: Hammer01Icon },
  { value: "baeckerei", label: "Bäckerei", icon: Bread01Icon },
  { value: "metzgerei", label: "Metzgerei", icon: SausageIcon },
  { value: "friseur", label: "Friseursalon", icon: ScissorIcon },
  { value: "elektro", label: "Elektrobetrieb", icon: FlashIcon },
];

/**
 * Options may carry an icon: put it into `items` and it shows in the list and, for the chosen
 * option, in the trigger. Every option has one, or none does.
 */
export const WithIcons: Story = {
  render: () => (
    <Select items={TRADES_WITH_ICONS} defaultValue="baeckerei" defaultOpen modal={false}>
      <SelectTrigger aria-label="Gewerk" className="w-64" />
      <SelectContent>
        {TRADES_WITH_ICONS.map((trade) => (
          <SelectItem key={trade.value} value={trade.value}>
            {trade.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

/** The same closed: empty with its placeholder, and in each size. */
export const WithIconsClosed: Story = {
  parameters: { visual: { viewport: { width: 380, height: 260 }, clip: undefined } },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Select items={TRADES_WITH_ICONS}>
        <SelectTrigger aria-label="Gewerk" placeholder="Bitte wählen" className="w-64" />
        <SelectContent>
          {TRADES_WITH_ICONS.map((trade) => (
            <SelectItem key={trade.value} value={trade.value}>
              {trade.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Select key={size} items={TRADES_WITH_ICONS} defaultValue="schreinerei">
          <SelectTrigger size={size} aria-label="Gewerk" />
          <SelectContent>
            {TRADES_WITH_ICONS.map((trade) => (
              <SelectItem key={trade.value} value={trade.value}>
                {trade.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  ),
};

const PLANS = [
  { value: "start", label: "Start", detail: "49 € / Monat" },
  { value: "werkstatt", label: "Werkstatt", detail: "89 € / Monat" },
  { value: "betrieb", label: "Betrieb", detail: "149 € / Monat" },
  { value: "einmalig", label: "Einmalig", detail: "ab 2.400 €" },
];

/**
 * Groups with a label, and a line before what stands apart. Each option carries a `detail`: a
 * quieter second piece of information at the right edge, here the price. It shows in the trigger
 * too.
 */
export const Groups: Story = {
  render: () => (
    <Select items={PLANS} defaultValue="werkstatt" defaultOpen modal={false}>
      <SelectTrigger aria-label="Tarif" className="w-72" />
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
  ),
};

const CURRENCIES = [
  { value: "eur", label: "Euro", icon: EuroIcon, detail: "EUR" },
  { value: "chf", label: "Schweizer Franken", icon: Coins01Icon, detail: "CHF" },
  { value: "usd", label: "US-Dollar", icon: DollarCircleIcon, detail: "USD" },
];

/** Icon, label and detail together. In a narrow trigger the label gives way, never the detail. */
export const WithDetails: Story = {
  render: () => (
    <Select items={CURRENCIES} defaultValue="chf" defaultOpen modal={false}>
      <SelectTrigger aria-label="Währung" className="w-52" />
      <SelectContent>
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency.value} value={currency.value}>
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
};

export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 380, height: 220 }, clip: undefined } },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Select key={size} items={TRADES} defaultValue="schreinerei">
          <SelectTrigger size={size} aria-label="Gewerk" />
          <SelectContent>
            {TRADES.map((trade) => (
              <SelectItem key={trade.value} value={trade.value}>
                {trade.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      <Select items={TRADES} defaultValue="schreinerei" disabled>
        <SelectTrigger aria-label="Gewerk" />
        <SelectContent>
          <SelectItem value="schreinerei">Schreinerei</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

/**
 * The keyboard path, as a test: the arrow keys open the list and move through it, Enter chooses,
 * Escape leaves without choosing, and the focus is back on the trigger either way.
 */
export const Keyboard: Story = {
  render: () => <TradeSelect />,
  play: async ({ canvas, userEvent, step }) => {
    const trigger = canvas.getByRole("combobox", { name: "Gewerk" });
    const option = (name: string) =>
      within(screen.getByRole("listbox")).getByRole("option", { name });
    // The highlight is set first and the focus follows it into the list a moment later. A key
    // pressed in between still goes to the trigger, so the next step waits for both.
    const highlighted = (name: string) =>
      waitFor(async () => {
        await expect(option(name)).toHaveAttribute("data-highlighted");
        await expect(option(name)).toHaveFocus();
      });

    await step(
      "Tab reaches the trigger, ArrowDown opens the list on its first option",
      async () => {
        await userEvent.tab();
        await expect(trigger).toHaveFocus();
        await userEvent.keyboard("{ArrowDown}");
        // The list fades in: wait until it has arrived.
        await waitFor(() => expect(screen.getByRole("listbox")).toBeVisible());
        await highlighted("Schreinerei");
      },
    );

    await step("ArrowDown moves the highlight, Enter chooses", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await highlighted("Bäckerei");
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
      await expect(trigger).toHaveTextContent("Bäckerei");
      await expect(trigger).toHaveFocus();
    });

    await step("Reopened, the list starts on the chosen option", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await highlighted("Bäckerei");
      await expect(option("Bäckerei")).toHaveAttribute("aria-selected", "true");
    });

    await step("Escape closes without choosing and returns the focus", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await highlighted("Metzgerei");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
      await expect(trigger).toHaveTextContent("Bäckerei");
      await expect(trigger).toHaveFocus();
    });
  },
};
