import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BarChart } from "@/components/bar-chart/bar-chart";
import { SegmentedBar } from "@/components/segmented-bar/segmented-bar";
import { Sparkline } from "@/components/sparkline/sparkline";
import { TimeSeriesChart } from "@/components/time-series-chart/time-series-chart";

import { type SeriesColor, seriesColorAt, seriesPaint, seriesPaintOf } from "./series-color";

describe("the colour of a place", () => {
  it("is the six in their fixed order", () => {
    expect([0, 1, 2, 3, 4, 5].map(seriesColorAt)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("never cycles: every series past the sixth wears the sixth", () => {
    expect(seriesColorAt(6)).toBe(6);
    expect(seriesColorAt(40)).toBe(6);
  });

  it("is the first for a place that is none", () => {
    expect(seriesColorAt(-1)).toBe(1);
    expect(seriesColorAt(Number.NaN)).toBe(1);
    expect(seriesColorAt(2.7)).toBe(3);
  });
});

describe("the paint of a series colour", () => {
  it.each([1, 2, 3, 4, 5, 6] as const)("series %s is its fill and the text on it", (color) => {
    expect(seriesPaint(color)).toEqual({
      fill: `var(--lf-series-${color})`,
      on: `var(--lf-on-series-${color})`,
    });
  });

  it("muted is the de-emphasis grey and the text that reads on it", () => {
    expect(seriesPaint("muted")).toEqual({
      fill: "var(--lf-series-muted)",
      on: "var(--lf-on-series-muted)",
    });
  });
});

describe("the paint of one series of several", () => {
  it("is the colour of its place when it names none", () => {
    expect(seriesPaintOf(undefined, 0)).toEqual(seriesPaint(1));
    expect(seriesPaintOf(undefined, 4)).toEqual(seriesPaint(5));
    expect(seriesPaintOf(undefined, 9)).toEqual(seriesPaint(6));
  });

  it("is its named colour wherever it stands", () => {
    const places = [0, 1, 5, 12];
    for (const color of [3, 6, "muted"] satisfies SeriesColor[]) {
      for (const place of places) expect(seriesPaintOf(color, place)).toEqual(seriesPaint(color));
    }
  });

  it("lets an unnamed series keep its place beside named ones", () => {
    // Named 3, unnamed, named muted: the middle one is still the second.
    const series: (SeriesColor | undefined)[] = [3, undefined, "muted"];
    expect(series.map((color, place) => seriesPaintOf(color, place).fill)).toEqual([
      "var(--lf-series-3)",
      "var(--lf-series-2)",
      "var(--lf-series-muted)",
    ]);
  });
});

/** How often `text` stands in `html`. */
const count = (html: string, text: string) => html.split(text).length - 1;

/** The series colours named in a piece of markup, in their order. */
const colours = (html: string) => html.match(/var\(--lf-series-[^)]+\)/g);

/** The legend of a chart's markup, and the markup without it. */
function parts(html: string, legend = 'data-slot="chart-legend"') {
  const start = html.indexOf(legend);
  const end = html.indexOf("</ul>", start);
  if (start === -1 || end === -1) return { legend: "", rest: html };
  return { legend: html.slice(start, end), rest: html.slice(0, start) + html.slice(end) };
}

const days = [
  { tag: "2026-11-01", claude: 4, speicher: 2, sonstige: 1 },
  { tag: "2026-11-02", claude: 6, speicher: 3, sonstige: 2 },
];

describe("a bar chart whose series name their colours", () => {
  const html = renderToStaticMarkup(
    <BarChart
      label="Kosten pro Tag"
      layout="stacked"
      data={days}
      x="tag"
      series={[
        { key: "claude", label: "Claude", color: 3 },
        { key: "speicher", label: "Speicher", color: 1 },
        { key: "sonstige", label: "Sonstige", color: "muted" },
      ]}
    />,
  );
  const { legend, rest } = parts(html);

  it("paints every bar of a series in its colour", () => {
    expect(count(rest, "background-color:var(--lf-series-3)")).toBe(days.length);
    expect(count(rest, "background-color:var(--lf-series-1)")).toBe(days.length);
    expect(count(rest, "background-color:var(--lf-series-muted)")).toBe(days.length);
    // The second place's own colour is worn by no one.
    expect(html).not.toContain("var(--lf-series-2)");
  });

  it("gives the legend the same colours, in the series' order", () => {
    expect(colours(legend)).toEqual([
      "var(--lf-series-3)",
      "var(--lf-series-1)",
      "var(--lf-series-muted)",
    ]);
  });

  it("lets a series without a colour keep its place", () => {
    const mixed = renderToStaticMarkup(
      <BarChart
        label="Kosten pro Tag"
        data={days}
        x="tag"
        series={[
          { key: "claude", label: "Claude", color: 3 },
          { key: "speicher", label: "Speicher" },
        ]}
      />,
    );
    expect(colours(parts(mixed).legend)).toEqual(["var(--lf-series-3)", "var(--lf-series-2)"]);
  });

  it("prefers a single series' own colour to the tone", () => {
    const one = (color?: SeriesColor) =>
      renderToStaticMarkup(
        <BarChart
          label="Kosten pro Tag"
          tone="accent"
          data={days}
          x="tag"
          series={[{ key: "claude", label: "Claude", color }]}
        />,
      );
    expect(count(one(3), "background-color:var(--lf-series-3)")).toBe(days.length);
    expect(one(3)).not.toContain("var(--lf-series-1)");
    expect(count(one(), "background-color:var(--lf-series-1)")).toBe(days.length);
  });
});

describe("a time series whose series name their colours", () => {
  const html = renderToStaticMarkup(
    <TimeSeriesChart
      label="Kosten pro Tag"
      data={days}
      x="tag"
      series={[
        { key: "claude", label: "Claude", color: 3 },
        { key: "speicher", label: "Speicher", color: 4 },
        { key: "sonstige", label: "Vormonat", kind: "comparison" },
      ]}
    />,
  );
  const { legend, rest } = parts(html);

  it("strokes each line in its colour and keeps the comparison grey", () => {
    expect(rest).toContain("stroke:var(--lf-series-3)");
    expect(rest).toContain("stroke:var(--lf-series-4)");
    expect(rest).toContain("stroke:var(--lf-series-muted)");
    expect(html).not.toContain("var(--lf-series-1)");
  });

  it("gives the legend the same colours", () => {
    expect(colours(legend)).toEqual([
      "var(--lf-series-3)",
      "var(--lf-series-4)",
      "var(--lf-series-muted)",
    ]);
  });
});

describe("a segmented bar whose parts name their colours", () => {
  const html = renderToStaticMarkup(
    <SegmentedBar
      label="Kosten nach Dienst"
      size="tall"
      data={[
        { name: "Claude", value: 60, color: 3 },
        { name: "Speicher", value: 30, color: 1 },
        { name: "Sonstige", value: 10, color: "muted" },
      ]}
    />,
  );
  const { legend, rest } = parts(html, "<ul");

  it("fills each part with its colour and prints its share in the text for that fill", () => {
    for (const color of [3, 1, "muted"]) {
      expect(count(rest, `background-color:var(--lf-series-${color})`)).toBe(1);
      expect(count(rest, `color:var(--lf-on-series-${color})`)).toBe(1);
    }
    expect(html).not.toContain("series-2)");
  });

  it("gives the legend the same colours", () => {
    expect(colours(legend)).toEqual([
      "var(--lf-series-3)",
      "var(--lf-series-1)",
      "var(--lf-series-muted)",
    ]);
  });

  it("colours by place without a named colour", () => {
    const plain = renderToStaticMarkup(
      <SegmentedBar
        label="Kosten nach Dienst"
        data={[
          { name: "Claude", value: 60 },
          { name: "Speicher", value: 40 },
        ]}
      />,
    );
    expect(colours(parts(plain, "<ul").legend)).toEqual([
      "var(--lf-series-1)",
      "var(--lf-series-2)",
    ]);
  });
});

describe("a sparkline that names its colour", () => {
  it("draws line, wash and end in it, whatever the tone", () => {
    const html = renderToStaticMarkup(
      <Sparkline data={[1, 3, 2, 5]} variant="area" tone="accent" color={3} />,
    );
    expect(html).toContain("stroke:var(--lf-series-3)");
    expect(html).toContain("fill:var(--lf-series-3)");
    expect(html).toContain("background-color:var(--lf-series-3)");
    expect(html).not.toContain("var(--lf-series-1)");
  });

  it("follows the tone without one", () => {
    expect(renderToStaticMarkup(<Sparkline data={[1, 3, 2, 5]} tone="accent" />)).toContain(
      "stroke:var(--lf-series-1)",
    );
    expect(renderToStaticMarkup(<Sparkline data={[1, 3, 2, 5]} />)).toContain(
      "stroke:var(--lf-text)",
    );
  });
});
