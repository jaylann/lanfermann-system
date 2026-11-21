import {
  BarChart,
  BarList,
  Bullet,
  Dumbbell,
  Funnel,
  Heatmap,
  SegmentedBar,
  Sparkline,
  TimeSeriesChart,
  Tracker,
  Waterfall,
} from "@lanfermann/ui";

/**
 * The charts as a server page hands them over: plain data across the line to the client parts,
 * and the `Sparkline` rendered on the server alone. Nothing here is a function, so it crosses
 * the boundary between server and client.
 */

const days = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(2026, 9, 22 + index);
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  return {
    tag: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    umsatz: (weekend ? 1200 : 3600) + ((index * 733) % 1400),
  };
});

export function Charts({ ground }: { ground: string }) {
  return (
    <div className="flex flex-col gap-8">
      <TimeSeriesChart
        label={`Umsatz pro Tag (${ground})`}
        variant="area"
        data={days}
        x="tag"
        series={[{ key: "umsatz", label: "Umsatz" }]}
        format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
        height={160}
      />
      <Sparkline data={days.map((day) => day.umsatz)} label="Umsatz der letzten 30 Tage" />
      <BarList
        aria-label={`Umsatz nach Kunde (${ground})`}
        data={[
          { name: "Gärtnerei Weiß", value: 18_640 },
          { name: "Schreinerei Mustermann", value: 14_280 },
          { name: "Bäckerei Kornprobst", value: 11_920 },
        ]}
        format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
      />
      <BarChart
        label={`Angebote pro Quartal (${ground})`}
        height={140}
        data={[
          { quartal: "Q1", angebote: 52 },
          { quartal: "Q2", angebote: 61 },
          { quartal: "Q3", angebote: 48 },
          { quartal: "Q4", angebote: 70 },
        ]}
        x="quartal"
        series={[{ key: "angebote", label: "Angebote" }]}
      />
      <SegmentedBar
        label={`Rechnungen nach Stand (${ground})`}
        data={[
          { name: "Bezahlt", value: 41_280 },
          { name: "Offen", value: 12_940 },
          { name: "Überfällig", value: 3_120 },
        ]}
      />
      <Tracker
        label={`Verfügbarkeit, letzte 30 Tage (${ground})`}
        data={days.map((day, index) => ({
          date: day.tag,
          status: index === 17 ? "warning" : "success",
        }))}
      />
      <Heatmap
        label={`Angebote pro Tag (${ground})`}
        data={days.map((day) => ({ date: day.tag, value: day.umsatz % 7 }))}
        unit={{ one: "Angebot", other: "Angebote" }}
      />
      <Funnel
        aria-label={`Vom Angebot zum Auftrag (${ground})`}
        data={[
          { name: "Angebot erstellt", value: 124 },
          { name: "Angebot gesendet", value: 108 },
          { name: "Angebot angenommen", value: 38 },
        ]}
      />
      <Bullet
        aria-label={`Ziele (${ground})`}
        data={[{ name: "Umsatz im November", value: 38_400, target: 50_000 }]}
        format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
      />
      <Waterfall
        label={`Ergebnis im November (${ground})`}
        height={140}
        data={[
          { name: "Einnahmen", value: 48_200 },
          { name: "Material", value: -14_800 },
          { name: "Ergebnis", value: 0, kind: "total" },
        ]}
      />
      <Dumbbell
        label={`Stundensätze (${ground})`}
        labels={["2025", "2026"]}
        data={[
          { name: "Beratung", from: 95, to: 105 },
          { name: "Wartung", from: 75, to: 75 },
        ]}
      />
    </div>
  );
}
