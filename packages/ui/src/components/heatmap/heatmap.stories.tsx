import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";

import { Heatmap } from "./heatmap";
import { quoteDays } from "./story-data";

const meta = {
  title: "Components/Heatmap",
  component: Heatmap,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 980, height: 300 }, target: '[data-slot="heatmap-grid"]' },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const year = quoteDays();
const quotes = { one: "Angebot", other: "Angebote" };

/** A year of written quotes: quiet weekends, the holiday in August, a busier autumn. */
export const Year: Story = {
  render: () => (
    <Heatmap
      className="w-[58rem] max-w-full"
      label="Geschriebene Angebote pro Tag, letztes Jahr"
      data={year}
      unit={quotes}
    />
  ),
};

/** A quarter on a card: thirteen weeks fit any width. */
export const Quarter: Story = {
  parameters: { visual: { viewport: { width: 560, height: 340 } } },
  render: () => (
    <Card className="w-[24rem] max-w-full">
      <CardBar>
        <Heading level={2} size="label">
          Angebote im Herbst
        </Heading>
        <span className="text-sm text-fg-muted tabular-nums">412 Angebote</span>
      </CardBar>
      <div className="px-5 py-4">
        <Heatmap
          label="Geschriebene Angebote pro Tag, letzte 13 Wochen"
          data={year.slice(-91)}
          unit={quotes}
        />
      </div>
    </Card>
  ),
};

/** Toward the text colour, for a page where Indigo is spent elsewhere. */
export const Neutral: Story = {
  render: () => (
    <Heatmap
      className="w-[58rem] max-w-full"
      label="Geschriebene Angebote pro Tag, letztes Jahr"
      data={year}
      unit={quotes}
      tone="neutral"
    />
  ),
};

/** On a phone the year scrolls sideways inside itself and opens at the newest week. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 300 } } },
  render: () => (
    <Heatmap
      className="w-full"
      label="Geschriebene Angebote pro Tag, letztes Jahr"
      data={year}
      unit={quotes}
    />
  ),
};

/** The arrows move a day (up and down) or a week (left and right); each day is said. */
export const Keyboard: Story = {
  render: () => (
    <Heatmap
      className="w-[58rem] max-w-full"
      label="Geschriebene Angebote pro Tag, letztes Jahr"
      data={year}
      unit={quotes}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const grid = canvas.getByRole("group", { name: /Geschriebene Angebote/ });
    const said = () => canvasElement.querySelector('[aria-live="polite"]');

    await step("Tab reaches the grid; the first arrow stands on the newest day", async () => {
      // The scrolling box comes first: it is reachable to scroll with the keys.
      for (let press = 0; press < 3 && document.activeElement !== grid; press++) {
        await userEvent.tab();
      }
      await expect(grid).toHaveFocus();
      await userEvent.keyboard("{ArrowUp}");
      await waitFor(() =>
        expect(said()).toHaveTextContent(/^Fr\., 20\. Nov\.( 2026)?: \d+ Angebot/),
      );
    });

    await step("Up goes a day back, left a week back", async () => {
      await userEvent.keyboard("{ArrowUp}");
      await waitFor(() => expect(said()).toHaveTextContent(/^Do\., 19\. Nov\./));
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() => expect(said()).toHaveTextContent(/^Do\., 12\. Nov\./));
    });

    await step("Escape leaves", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvasElement.querySelector("[data-shown]")).toBeNull());
    });

    await step("Coming back to a day that was said before, it is said again", async () => {
      await userEvent.keyboard("{End}");
      await waitFor(() => expect(said()).toHaveTextContent(/^Fr\., 20\. Nov\./));
      await userEvent.keyboard("{Escape}");
      // Emptied: the same line set again would not be announced.
      await waitFor(() => expect(said()).toBeEmptyDOMElement());
      await userEvent.keyboard("{ArrowUp}");
      await waitFor(() => expect(said()).toHaveTextContent(/^Fr\., 20\. Nov\./));
    });
  },
};
