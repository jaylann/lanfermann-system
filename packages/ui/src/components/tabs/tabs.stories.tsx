import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Tab, Tabs, TabsList, TabsPanel, TabsPanels } from "./tabs";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: { visual: { viewport: { width: 560, height: 200 } } },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One highlight glides to the current tab and its mark closes from ring to disc. Arrow keys move
 * between tabs.
 */
export const Default: Story = {
  parameters: {
    visual: {
      target: '[data-slot="tab"]:nth-of-type(2)',
      motion: [{ name: "switch", click: '[data-slot="tab"]:nth-of-type(3)', frames: 8 }],
    },
  },
  render: () => (
    <Tabs defaultValue="konto" className="w-[480px]">
      <TabsList>
        <Tab value="konto">Konto</Tab>
        <Tab value="team">Team</Tab>
        <Tab value="abrechnung">Abrechnung</Tab>
        <Tab value="sicherheit" disabled>
          Sicherheit
        </Tab>
      </TabsList>
      <TabsPanel value="konto" className="text-fg-body">
        Name, E-Mail-Adresse und Sprache Ihres Kontos.
      </TabsPanel>
      <TabsPanel value="team" className="text-fg-body">
        Wer in Ihrem Betrieb Angebote sehen und senden darf.
      </TabsPanel>
      <TabsPanel value="abrechnung" className="text-fg-body">
        Tarif, Zahlungsart und Rechnungen.
      </TabsPanel>
    </Tabs>
  ),
};

const clients = ["Claude Desktop", "Claude Code", "Cursor", "VS Code", "claude.ai"] as const;

/**
 * More tabs than a phone is wide: the row stays one row and scrolls inside itself. Its edges fade
 * where more tabs wait, and the current tab is brought into view, here the fourth.
 */
export const Overflowing: Story = {
  parameters: { visual: { viewport: { width: 390, height: 160 } } },
  render: () => (
    <Tabs defaultValue="VS Code" className="w-[350px]">
      <TabsList>
        {clients.map((client) => (
          <Tab key={client} value={client}>
            {client}
          </Tab>
        ))}
      </TabsList>
    </Tabs>
  ),
};

/**
 * Panels of different heights, stacked: each stays rendered, the ones not shown are invisible
 * and inert, and the place is as tall as the tallest, so what stands below never moves.
 */
export const Stacked: Story = {
  parameters: { visual: { viewport: { width: 560, height: 260 } } },
  render: () => (
    <div className="flex w-[480px] flex-col gap-4">
      <Tabs defaultValue="kurz">
        <TabsList>
          <Tab value="kurz">Kurz</Tab>
          <Tab value="lang">Lang</Tab>
        </TabsList>
        <TabsPanels>
          <TabsPanel value="kurz" className="text-fg-body">
            Eine Zeile.
          </TabsPanel>
          <TabsPanel value="lang" className="text-fg-body">
            Drei Zeilen: Name, E-Mail-Adresse und Sprache Ihres Kontos, dazu wer in Ihrem Betrieb
            Angebote sehen und senden darf, und zuletzt Tarif, Zahlungsart und Rechnungen.
          </TabsPanel>
        </TabsPanels>
      </Tabs>
      <p className="border-t border-hairline pt-3 text-sm text-fg-muted">Das steht still.</p>
    </div>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const below = canvas.getByText("Das steht still.");
    const top = () => below.getBoundingClientRect().top;
    const before = top();

    await step("Switching to the longer panel moves nothing below", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: "Lang" }));
      await waitFor(() =>
        expect(canvas.getByRole("tab", { name: "Lang" })).toHaveAttribute("aria-selected", "true"),
      );
      await expect(top()).toBe(before);
    });

    await step("The panel not shown stays in place but out of reach", async () => {
      await expect(canvas.getByText("Eine Zeile.")).toHaveAttribute("inert");
    });
  },
};

/**
 * The keyboard path, as a test: the list is one Tab stop, the arrows move between tabs without
 * switching (a disabled tab can be reached, so it can be read), Enter switches, and the next Tab
 * lands in the panel.
 */
export const Keyboard: Story = {
  render: Default.render,
  play: async ({ canvas, userEvent, step }) => {
    const tab = (name: string) => canvas.getByRole("tab", { name });

    await step("Tab enters the list on the current tab", async () => {
      await userEvent.tab();
      await expect(tab("Konto")).toHaveFocus();
    });

    await step("ArrowRight moves the focus and leaves the panel alone", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(tab("Team")).toHaveFocus();
      await expect(tab("Konto")).toHaveAttribute("aria-selected", "true");
      await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Name, E-Mail-Adresse");
    });

    await step("Enter switches to the focused tab", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(tab("Team")).toHaveAttribute("aria-selected", "true");
      // The panels change places a moment after the tab does.
      await waitFor(() =>
        expect(canvas.getByRole("tabpanel")).toHaveTextContent("Wer in Ihrem Betrieb"),
      );
    });

    await step("End reaches the disabled tab, which does not open", async () => {
      await userEvent.keyboard("{End}");
      await expect(tab("Sicherheit")).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(tab("Team")).toHaveAttribute("aria-selected", "true");
    });

    await step("Home goes back to the first tab, the arrows wrap around", async () => {
      await userEvent.keyboard("{Home}");
      await expect(tab("Konto")).toHaveFocus();
      await userEvent.keyboard("{ArrowLeft}");
      await expect(tab("Sicherheit")).toHaveFocus();
    });

    await step("Tab leaves the list for the panel", async () => {
      await userEvent.tab();
      await waitFor(() => expect(canvas.getByRole("tabpanel")).toHaveFocus());
    });
  },
};
