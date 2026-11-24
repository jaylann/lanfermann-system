import { ColumnChart } from "@/slides/column-chart/column-chart";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** Six months as columns on a baseline: every value written out, the last one in the accent. */
export function ColumnChartExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={5}>
      <Title>
        Seit dem Relaunch kommen
        <br />
        dreimal so viele Anfragen.
      </Title>
      <Spacer />
      <ColumnChart
        items={[
          { label: "Mai", value: 4 },
          { label: "Juni", value: 5 },
          { label: "Juli", value: 4 },
          { label: "August", value: 9 },
          { label: "September", value: 12 },
          { label: "Oktober", value: 14, highlight: true },
        ]}
      />
      <Source>
        Anfragen über das Kontaktformular je Monat, Schreinerei Mustermann, Relaunch am 1.8.2026
      </Source>
    </Slide>
  );
}
