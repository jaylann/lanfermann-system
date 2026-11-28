import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BarChart } from "@/components/bar-chart/bar-chart";
import { Dumbbell } from "@/components/dumbbell/dumbbell";
import { Heatmap } from "@/components/heatmap/heatmap";
import { TimeSeriesChart } from "@/components/time-series-chart/time-series-chart";
import { Waterfall } from "@/components/waterfall/waterfall";
import { LocaleProvider } from "@/locale/locale";

const months = [
  { month: "2026-10-01", revenue: 12, costs: 4 },
  { month: "2026-11-01", revenue: 18, costs: 6 },
];
const series = [{ key: "revenue", label: "Umsatz" }] as const;

/** Each chart with the words it says on its own, and where in its markup they stand. */
const charts: [name: string, hint: string, extra: string[], draw: (words?: object) => ReactNode][] =
  [
    [
      "BarChart",
      "Mit den Pfeiltasten durch die Werte gehen.",
      ["Kategorie"],
      (words) => <BarChart data={months} x="month" series={series} label="Umsatz" words={words} />,
    ],
    [
      "TimeSeriesChart",
      "Mit den Pfeiltasten durch die Werte gehen.",
      ["Zeitpunkt"],
      (words) => (
        <TimeSeriesChart data={months} x="month" series={series} label="Umsatz" words={words} />
      ),
    ],
    [
      "Waterfall",
      "Mit den Pfeiltasten durch die Schritte gehen.",
      ["Schritt", "Veränderung", "Stand"],
      (words) => (
        <Waterfall
          data={[
            { name: "Umsatz", value: 18 },
            { name: "Ergebnis", value: 0, kind: "total" },
          ]}
          label="Ergebnis"
          words={words}
        />
      ),
    ],
    [
      "Dumbbell",
      "Mit den Pfeiltasten durch die Zeilen gehen.",
      ["Zeile"],
      (words) => (
        <Dumbbell
          data={[{ name: "Stundensatz", from: 80, to: 92 }]}
          labels={["2025", "2026"]}
          label="Preise"
          words={words}
        />
      ),
    ],
  ];

describe("a chart's own words", () => {
  it.each(charts)(
    "are the table's in %s, German without a provider",
    (_name, hint, extra, draw) => {
      const german = renderToStaticMarkup(draw());
      expect(german).toContain('aria-roledescription="Diagramm"');
      expect(german).toContain(`. ${hint}"`);
      for (const word of extra) expect(german).toContain(`>${word}</th>`);

      const english = renderToStaticMarkup(<LocaleProvider locale="en">{draw()}</LocaleProvider>);
      expect(english).toContain('aria-roledescription="Chart"');
      expect(english).not.toContain(hint);
    },
  );

  it.each(charts)("are the caller's in %s, one by one", (_name, hint, extra, draw) => {
    const worded = renderToStaticMarkup(draw({ chart: "Grafik" }));
    expect(worded).toContain('aria-roledescription="Grafik"');
    // What was not worded stays the table's.
    expect(worded).toContain(`. ${hint}"`);
    for (const word of extra) expect(worded).toContain(`>${word}</th>`);

    const hinted = renderToStaticMarkup(draw({ hint: "Pfeiltasten wählen." }));
    expect(hinted).toContain('. Pfeiltasten wählen."');
    expect(hinted).toContain('aria-roledescription="Diagramm"');
  });

  it("head the tables behind the charts", () => {
    const bars = (
      <BarChart
        data={months}
        x="month"
        series={[...series, { key: "costs", label: "Kosten" }]}
        layout="stacked"
        label="Umsatz"
        words={{ category: "Monat" }}
      />
    );
    expect(renderToStaticMarkup(bars)).toContain(">Monat</th>");
    const steps = (
      <Waterfall
        data={[{ name: "Umsatz", value: 18 }]}
        label="Ergebnis"
        words={{ step: "Posten", change: "Betrag" }}
      />
    );
    const table = renderToStaticMarkup(steps);
    expect(table).toContain(">Posten</th>");
    expect(table).toContain(">Betrag</th>");
    expect(table).toContain(">Stand</th>");
    const sum = (
      <Waterfall
        data={[{ name: "Ergebnis", value: 0, kind: "total" }]}
        label="Ergebnis"
        words={{ total: "Gesamt" }}
      />
    );
    expect(renderToStaticMarkup(sum)).toContain("<td>Gesamt</td>");
  });

  it("name a heatmap's grid", () => {
    const days = [
      { date: "2026-11-02", value: 3 },
      { date: "2026-11-03", value: 0 },
    ];
    const german = renderToStaticMarkup(<Heatmap data={days} label="Angebote" />);
    expect(german).toContain('aria-roledescription="Kalender"');
    expect(german).toContain('. Mit den Pfeiltasten durch die Tage gehen."');
    const worded = renderToStaticMarkup(
      <Heatmap data={days} label="Angebote" words={{ chart: "Raster", hint: "Tage wählen." }} />,
    );
    expect(worded).toContain('aria-roledescription="Raster"');
    expect(worded).toContain('aria-label="Angebote. Tage wählen."');
  });
});
