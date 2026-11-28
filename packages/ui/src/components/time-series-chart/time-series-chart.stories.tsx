import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Card, CardBar } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";
import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { Segment, SegmentedControl } from "@/components/segmented-control/segmented-control";
import { Stat, StatLabel, StatValue } from "@/components/stat/stat";
import { pointLabel, toTime } from "@/internal/chart/time";

import { requestHours, revenueDays, revenueMonths, visitDays } from "./story-data";
import { TimeSeriesChart } from "./time-series-chart";

const meta = {
  title: "Components/TimeSeriesChart",
  component: TimeSeriesChart,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 760, height: 420 },
      target: '[data-slot="time-series-chart-plot"]',
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const euro = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;
const revenue = revenueDays();

/** One series, in the text colour: revenue per day over thirty days. */
export const Default: Story = {
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Tag"
      data={revenue}
      x="tag"
      series={[{ key: "umsatz", label: "Umsatz" }]}
      format={euro}
    />
  ),
};

/** The room under a single line washed in its colour; `tone="accent"` for the one chart a view is about. */
export const Area: Story = {
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Tag"
      variant="area"
      tone="accent"
      data={revenue}
      x="tag"
      series={[{ key: "umsatz", label: "Umsatz" }]}
      format={euro}
    />
  ),
};

/** The washes of an area: fading to the baseline (the default), even, and none (a line). */
export const Washes: Story = {
  parameters: { visual: { viewport: { width: 1180, height: 640 } } },
  render: () => (
    <div className="grid w-[72rem] max-w-full grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
      {(["neutral", "accent"] as const).map((tone) =>
        (["fade", "flat", "line"] as const).map((wash) => (
          <TimeSeriesChart
            key={`${wash}-${tone}`}
            label={`Umsatz pro Tag, ${wash === "fade" ? "Verlauf" : wash === "flat" ? "gleichmäßig" : "ohne Fläche"}`}
            variant={wash === "line" ? "line" : "area"}
            wash={wash === "line" ? undefined : wash}
            tone={tone}
            height={160}
            data={revenue}
            x="tag"
            series={[{ key: "umsatz", label: "Umsatz" }]}
            format={euro}
          />
        )),
      )}
    </div>
  ),
};

/**
 * A point that stands for a month: the band marks the whole month under the pointer, where a
 * hairline would mark an instant.
 */
export const Band: Story = {
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Monat"
      variant="area"
      crosshair="band"
      curve="linear"
      data={revenueMonths()}
      x="monat"
      series={[{ key: "umsatz", label: "Umsatz" }]}
      format={euro}
    />
  ),
};

/** The figure above follows the pointer; `readout` decides whether the crosshair speaks too. */
function WithFigure({ readout, follow }: { readout: boolean; follow: boolean }) {
  const [active, setActive] = useState<(typeof revenue)[number] | null>(null);
  const total = revenue.reduce((sum, day) => sum + day.umsatz, 0);
  const shown = follow ? active : null;
  return (
    <div className="flex w-[42rem] max-w-full flex-col gap-5">
      <Stat>
        <StatLabel>
          {shown ? pointLabel(toTime(shown.tag), "day") : "Umsatz in den letzten 30 Tagen"}
        </StatLabel>
        <StatValue>
          <RollingNumber value={shown ? shown.umsatz : total} format={euro} />
        </StatValue>
      </Stat>
      <TimeSeriesChart
        label="Umsatz pro Tag"
        variant="area"
        readout={readout}
        data={revenue}
        x="tag"
        series={[{ key: "umsatz", label: "Umsatz" }]}
        format={euro}
        onActiveChange={(next) => setActive(next?.row ?? null)}
      />
    </div>
  );
}

/**
 * Reading the value under the pointer, as it is meant on a dashboard (Justin, 2026-11-20): the
 * figure above rolls to it and the readout names the day. Both other ways stay: `readout={false}`
 * leaves the figure alone to say it, and a figure that ignores `onActiveChange` stays the total.
 */
export const WithAFigure: Story = {
  name: "With a figure",
  parameters: { visual: { viewport: { width: 760, height: 480 } } },
  render: () => <WithFigure readout follow />,
};

/** The figure alone reads the value; the plot stays free. */
export const FigureOnly: Story = {
  name: "Figure only",
  parameters: { visual: { viewport: { width: 760, height: 480 } } },
  render: () => <WithFigure readout={false} follow />,
};

/** The figure stays the total; the readout alone says the day's value. */
export const ReadoutOnly: Story = {
  name: "Readout only",
  parameters: { visual: { viewport: { width: 760, height: 480 } } },
  render: () => <WithFigure readout follow={false} />,
};

/** This month against the one before: the period before is context, in the quiet grey. */
export const Comparison: Story = {
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Tag, mit dem Vormonat"
      data={revenue}
      x="tag"
      series={[
        { key: "umsatz", label: "November" },
        { key: "vormonat", label: "Oktober", kind: "comparison" },
      ]}
      format={euro}
    />
  ),
};

/** Several series in the fixed order of the series colours, named in the legend. */
export const SeveralSeries: Story = {
  name: "Several series",
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Besuche nach Herkunft"
      data={visitDays()}
      x="tag"
      series={[
        { key: "suche", label: "Suche" },
        { key: "direkt", label: "Direkt" },
        { key: "empfehlung", label: "Empfehlung" },
        { key: "newsletter", label: "Newsletter" },
      ]}
    />
  ),
};

/** A level to reach, and today still being counted: its stretch is dashed. */
export const TargetAndToday: Story = {
  name: "Target and today",
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Tag"
      variant="area"
      data={revenue}
      x="tag"
      series={[{ key: "umsatz", label: "Umsatz" }]}
      format={euro}
      target={{ value: 5000, label: "Ziel 5.000 €" }}
      incomplete
    />
  ),
};

/** A year of months: the axis names months and the turn of the year. */
export const Months: Story = {
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Monat"
      data={revenueMonths()}
      x="monat"
      series={[
        { key: "umsatz", label: "Umsatz" },
        { key: "vorjahr", label: "Vorjahr", kind: "comparison" },
      ]}
      format={euro}
      curve="linear"
    />
  ),
};

/** Two days by the hour, with a spike of errors: two measures of different size get two charts. */
export const Hours: Story = {
  render: () => (
    <div className="flex w-[42rem] max-w-full flex-col gap-8">
      <TimeSeriesChart
        label="Anfragen pro Stunde"
        height={160}
        data={requestHours()}
        x="stunde"
        series={[{ key: "anfragen", label: "Anfragen" }]}
      />
      <TimeSeriesChart
        label="Fehler pro Stunde"
        height={96}
        data={requestHours()}
        x="stunde"
        series={[{ key: "fehler", label: "Fehler" }]}
      />
    </div>
  ),
};

/** Nothing measured yet: one sentence where the lines would be, the chart keeps its size. */
export const Empty: Story = {
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Tag"
      data={[]}
      x="tag"
      series={[{ key: "umsatz", label: "Umsatz" }]}
    />
  ),
};

const ranges = { "7": 7, "30": 30, "90": 90 } as const;
type Range = keyof typeof ranges;

/** As it stands in an app: on a card under its bar, the range beside the name. */
function RevenueCard({ initial = "30" }: { initial?: Range }) {
  const [range, setRange] = useState<Range>(initial);
  return (
    <Card className="w-[46rem] max-w-full">
      <CardBar>
        <Heading level={2} size="label">
          Umsatz pro Tag
        </Heading>
        <SegmentedControl
          aria-label="Zeitraum"
          value={range}
          onValueChange={(next) => setRange(next as Range)}
        >
          <Segment value="7" data-step="7">
            7 Tage
          </Segment>
          <Segment value="30" data-step="30">
            30 Tage
          </Segment>
          <Segment value="90" data-step="90">
            90 Tage
          </Segment>
        </SegmentedControl>
      </CardBar>
      <div className="px-5 pt-4 pb-5">
        <TimeSeriesChart
          label="Umsatz pro Tag"
          variant="area"
          data={revenueDays(ranges[range])}
          x="tag"
          series={[{ key: "umsatz", label: "Umsatz" }]}
          format={euro}
        />
      </div>
    </Card>
  );
}

/** On a card, with a choice of range: the line re-forms to the new range instead of jumping. */
export const InACard: Story = {
  name: "In a card",
  parameters: {
    visual: {
      viewport: { width: 820, height: 480 },
      motion: [{ name: "range", click: '[data-step="7"]' }],
    },
  },
  render: () => <RevenueCard />,
};

/** On a phone: the axis keeps fewer marks, a finger scrubs sideways and the page still scrolls. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 520 }, motion: [] } },
  render: () => (
    <div className="flex w-full flex-col gap-8">
      <RevenueCard />
      <TimeSeriesChart
        label="Besuche nach Herkunft"
        height={180}
        data={visitDays()}
        x="tag"
        series={[
          { key: "suche", label: "Suche" },
          { key: "direkt", label: "Direkt" },
          { key: "empfehlung", label: "Empfehlung" },
        ]}
      />
    </div>
  ),
};

/** The keyboard walks the points and each one is said; Escape leaves. */
export const Keyboard: Story = {
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Tag"
      data={revenue}
      x="tag"
      series={[
        { key: "umsatz", label: "November" },
        { key: "vormonat", label: "Oktober", kind: "comparison" },
      ]}
      format={euro}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const plot = canvas.getByRole("group", { name: /Umsatz pro Tag/ });
    const readout = () => canvasElement.querySelector('[data-slot="chart-readout"]');

    await step("Tab reaches the plot; the first arrow stands on the latest point", async () => {
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      await expect(plot).toHaveFocus();
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() => expect(readout()).toHaveTextContent("Fr., 20. Nov."));
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() => expect(readout()).toHaveTextContent("Do., 19. Nov."));
    });

    await step("Each point is said with every series' value", async () => {
      const said = canvasElement.querySelector('[aria-live="polite"]');
      await expect(said).toHaveTextContent(/^Do\., 19\. Nov\.: November .+ €, Oktober .+ €$/);
    });

    await step("Home goes to the first point, Escape leaves", async () => {
      await userEvent.keyboard("{Home}");
      await waitFor(() => expect(readout()).toHaveTextContent("Do., 22. Okt."));
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(canvasElement.querySelector("[data-shown]")).toBeNull());
    });
  },
};

/** A series pressed in the legend leaves; the others keep their colours and the axis rescales. */
export const HiddenSeries: Story = {
  name: "Hidden series",
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Besuche nach Herkunft"
      data={visitDays()}
      x="tag"
      series={[
        { key: "suche", label: "Suche" },
        { key: "direkt", label: "Direkt" },
        { key: "newsletter", label: "Newsletter" },
      ]}
    />
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const colorOf = (key: string) =>
      canvasElement.querySelector<SVGPathElement>(`path[data-series="${key}"]`)?.style.stroke;

    await step("Hiding the first series keeps the others' colours", async () => {
      const before = colorOf("newsletter");
      await userEvent.click(canvas.getByRole("button", { name: "Suche" }));
      await expect(canvas.getByRole("button", { name: "Suche" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(canvasElement.querySelector('path[data-series="suche"]')).toBeNull();
      await expect(colorOf("newsletter")).toBe(before);
    });

    await step("The last series shown cannot be hidden", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Direkt" }));
      await userEvent.click(canvas.getByRole("button", { name: "Newsletter" }));
      await expect(canvas.getByRole("button", { name: "Newsletter" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  },
};

/** A field's name with a space in it: the area is still washed in the series' colour. */
export const KeyWithASpace: Story = {
  name: "Key with a space",
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Tag"
      variant="area"
      data={revenue.map((day) => ({ tag: day.tag, "Umsatz netto": day.umsatz }))}
      x="tag"
      series={[{ key: "Umsatz netto", label: "Umsatz" }]}
      format={euro}
    />
  ),
  play: async ({ canvasElement }) => {
    const area = canvasElement.querySelector('path[data-shape="area"]');
    // A reference the browser cannot read leaves the fill at its default, black.
    await expect(getComputedStyle(area!).fill).toMatch(/^url\(/);
  },
};

const visits = visitDays();
const twoSources = [
  { key: "suche", label: "Suche" },
  { key: "direkt", label: "Direkt" },
] as const;

function SourceChoice() {
  const [choice, setChoice] = useState("beide");
  return (
    <div className="flex w-[42rem] max-w-full flex-col items-start gap-4">
      <SegmentedControl aria-label="Herkunft" value={choice} onValueChange={setChoice}>
        <Segment value="beide">Suche und Direkt</Segment>
        <Segment value="suche">Nur Suche</Segment>
      </SegmentedControl>
      <TimeSeriesChart
        className="w-full"
        label="Besuche nach Herkunft"
        data={visits}
        x="tag"
        series={choice === "beide" ? twoSources : twoSources.slice(0, 1)}
      />
    </div>
  );
}

/**
 * A series hidden in the legend that then becomes the only one: it is drawn, since a single
 * series has no legend to bring it back with.
 */
export const HiddenThenAlone: Story = {
  name: "Hidden, then alone",
  render: () => <SourceChoice />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const line = () => canvasElement.querySelector('path[data-series="suche"]');
    await userEvent.click(canvas.getByRole("button", { name: "Suche" }));
    await expect(line()).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Nur Suche" }));
    await waitFor(() => expect(line()).not.toBeNull());
  },
};

function Revealed() {
  const [view, setView] = useState("zahl");
  return (
    <div className="flex w-[42rem] max-w-full flex-col items-start gap-4">
      <SegmentedControl aria-label="Ansicht" value={view} onValueChange={setView}>
        <Segment value="zahl">Zahl</Segment>
        <Segment value="verlauf">Verlauf</Segment>
      </SegmentedControl>
      <div hidden={view !== "verlauf"} className="w-full">
        <TimeSeriesChart
          label="Umsatz pro Tag"
          data={revenue}
          x="tag"
          series={[{ key: "umsatz", label: "Umsatz" }]}
          format={euro}
        />
      </div>
    </div>
  );
}

/**
 * A chart that is not laid out at first (a closed panel): the axis column is measured when it
 * shows, not at a width of nothing it would then ease open from.
 */
export const ShownLater: Story = {
  name: "Shown later",
  render: () => <Revealed />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const grid = canvasElement.querySelector<HTMLElement>(
      '[data-slot="time-series-chart-plot"]',
    )!.parentElement!;
    await expect(grid.style.getPropertyValue("--axis-width")).toBe("");
    await userEvent.click(canvas.getByRole("button", { name: "Verlauf" }));
    await waitFor(() =>
      expect(grid.style.getPropertyValue("--axis-width")).toMatch(/^[1-9]\d*px$/),
    );
  },
};

/** Without data the plot is no stop, and its name does not ask for keys that would do nothing. */
export const EmptyKeyboard: Story = {
  name: "Empty, keyboard",
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Tag"
      data={[]}
      x="tag"
      series={[{ key: "umsatz", label: "Umsatz" }]}
    />
  ),
  play: async ({ canvas }) => {
    const plot = canvas.getByRole("group", { name: "Umsatz pro Tag" });
    await expect(plot).not.toHaveAttribute("tabindex");
  },
};

/** The first day of a new account: one value is a point, not an empty plot. */
export const OnePoint: Story = {
  name: "One point",
  render: () => (
    <TimeSeriesChart
      className="w-[42rem] max-w-full"
      label="Umsatz pro Tag"
      data={revenue.slice(-1)}
      x="tag"
      series={[{ key: "umsatz", label: "Umsatz" }]}
      format={euro}
    />
  ),
  play: async ({ canvasElement }) => {
    const line = canvasElement.querySelector('path[data-shape="line"]');
    // A line of no length, which its round caps draw as a dot; a move alone would draw nothing.
    await expect(line?.getAttribute("d")).toMatch(/^M([\d.]+),([\d.]+)L\1,\2$/);
  },
};
