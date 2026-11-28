import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Card, CardContent } from "@/components/card/card";
import { Tabs, TabsPanel } from "@/components/tabs/tabs";
import { TimeSeriesChart } from "@/components/time-series-chart/time-series-chart";

import { StatChange, type StatChangeProps } from "./stat";
import { StatTab, StatTabsList } from "./stat-tabs";

const meta = {
  title: "Components/StatTabs",
  component: StatTabsList,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 860, height: 440 },
      target: '[data-slot="stat-tab"]:not([data-active])',
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

type Day = {
  tag: string;
  klicks: number;
  impressionen: number;
  klickrate: number;
  position: number;
};

/** Four weeks of a website in the search results, made from fixed waves so every capture agrees. */
const DAYS: Day[] = Array.from({ length: 28 }, (_, index) => {
  const weekend = index % 7 === 5 || index % 7 === 6 ? 0.72 : 1;
  const impressionen = Math.round((1180 + index * 14 + Math.sin(index / 2.1) * 130) * weekend);
  const klickrate = 0.036 + index * 0.0004 + Math.sin(index / 3.3) * 0.004;
  return {
    tag: `2026-11-${String(index + 1).padStart(2, "0")}`,
    impressionen,
    klicks: Math.round(impressionen * klickrate),
    klickrate,
    position: 14.2 - index * 0.11 + Math.cos(index / 2.7) * 0.6,
  };
});

type Measure = {
  id: "klicks" | "impressionen" | "klickrate" | "position";
  label: string;
  value: string;
  change: string;
  trend: StatChangeProps["trend"];
  tone: StatChangeProps["tone"];
  format: Intl.NumberFormatOptions;
  zero: boolean;
};

const MEASURES: Measure[] = [
  {
    id: "klicks",
    label: "Klicks",
    value: "1.284",
    change: "+12 %",
    trend: "up",
    tone: "positive",
    format: { maximumFractionDigits: 0 },
    zero: true,
  },
  {
    id: "impressionen",
    label: "Impressionen",
    value: "31.906",
    change: "+4 %",
    trend: "up",
    tone: "positive",
    format: { maximumFractionDigits: 0 },
    zero: true,
  },
  {
    id: "klickrate",
    label: "Klickrate",
    value: "4,0 %",
    change: "+0,3 Punkte",
    trend: "up",
    tone: "positive",
    format: { style: "percent", maximumFractionDigits: 1 },
    zero: true,
  },
  {
    id: "position",
    label: "Position",
    value: "11,4",
    // A lower place is the better one: it went down, and that is good news.
    change: "−1,8",
    trend: "down",
    tone: "positive",
    format: { maximumFractionDigits: 1 },
    zero: false,
  },
];

function Search({
  initial = "klicks",
  disabled,
}: {
  initial?: Measure["id"];
  disabled?: Measure["id"];
}) {
  const [shown, setShown] = useState<Measure["id"]>(initial);
  const measure = MEASURES.find(({ id }) => id === shown) ?? MEASURES[0]!;
  return (
    <Card className="mx-auto max-w-3xl">
      <CardContent>
        <Tabs value={shown} onValueChange={(next) => setShown(next as Measure["id"])}>
          <StatTabsList aria-label="Kennzahl">
            {MEASURES.map((each) => (
              <StatTab
                key={each.id}
                value={each.id}
                label={each.label}
                disabled={each.id === disabled}
                change={
                  <StatChange render={<span />} trend={each.trend} tone={each.tone}>
                    {each.change}
                  </StatChange>
                }
              >
                {each.value}
              </StatTab>
            ))}
          </StatTabsList>
          {/* One panel that belongs to whichever tab is chosen: the chart stays and changes its
              measure, instead of one chart per tab. */}
          <TabsPanel value={shown}>
            <TimeSeriesChart
              data={DAYS}
              x="tag"
              series={[{ key: measure.id, label: measure.label }]}
              label={`${measure.label} in den letzten vier Wochen`}
              variant="area"
              tone="accent"
              format={measure.format}
              zero={measure.zero}
              height={220}
              drawIn={false}
            />
          </TabsPanel>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * The four figures of a website in the search results, as the tabs of one chart: the chosen one
 * stands on the highlight with its mark closed, and the chart draws it. Press another and the
 * highlight glides to it.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [{ name: "glide", click: '[data-slot="stat-tab"]:nth-of-type(3)', frames: 8 }],
    },
  },
  render: () => <Search />,
};

/** Another figure chosen: the highlight is as wide as a column, wherever it stands. */
export const Chosen: Story = { render: () => <Search initial="klickrate" /> };

/** A figure that cannot be drawn right now keeps its place and takes no press. */
export const Disabled: Story = { render: () => <Search disabled="position" /> };

/**
 * On a phone the figures stand two abreast, and the highlight travels down as well as across.
 */
export const Phone: Story = {
  parameters: {
    visual: {
      viewport: { width: 390, height: 600 },
      motion: [{ name: "down", click: '[data-slot="stat-tab"]:nth-of-type(4)', frames: 8 }],
    },
  },
  render: () => <Search />,
};

/**
 * The keyboard path, as a test: the row is one stop, the arrow keys move between the figures,
 * Enter or Space chooses, the chosen one says so, and the panel under them belongs to it.
 */
export const Keyboard: Story = {
  render: () => <Search />,
  play: async ({ canvas, userEvent, step }) => {
    const tab = (name: RegExp) => canvas.getByRole("tab", { name });

    await step("the row has a name, and one figure is chosen", async () => {
      await expect(canvas.getByRole("tablist", { name: "Kennzahl" })).toBeVisible();
      await expect(tab(/^Klicks/)).toHaveAttribute("aria-selected", "true");
      await expect(tab(/^Impressionen/)).toHaveAttribute("aria-selected", "false");
    });

    await step("a figure says its label, its value and how it moved", async () => {
      await expect(tab(/^Position/)).toHaveAccessibleName(/Position\s*11,4\s*Gesunken: −1,8/);
    });

    await step("Tab reaches the chosen figure; the arrows move on, Enter chooses", async () => {
      await userEvent.tab();
      await expect(tab(/^Klicks/)).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(tab(/^Impressionen/)).toHaveFocus();
      // As in a `TabsList`, moving does not choose: the chart stays until a figure is taken.
      await expect(tab(/^Klicks/)).toHaveAttribute("aria-selected", "true");
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(tab(/^Impressionen/)).toHaveAttribute("aria-selected", "true"));
      await userEvent.keyboard("{End}");
      await expect(tab(/^Position/)).toHaveFocus();
      await userEvent.keyboard(" ");
      await waitFor(() => expect(tab(/^Position/)).toHaveAttribute("aria-selected", "true"));
    });

    await step("the panel belongs to the chosen figure and shows its chart", async () => {
      const panel = canvas.getByRole("tabpanel");
      await expect(panel).toHaveAccessibleName(/Position/);
      await expect(
        canvas.getByRole("figure", { name: "Position in den letzten vier Wochen" }),
      ).toBeVisible();
    });
  },
};
