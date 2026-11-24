import { BarList } from "@/slides/bar-list/bar-list";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** A ranking as bars: three rows sorted by value, the one the title is about in the accent. */
export function BarListExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={4}>
      <Title>
        Gesucht wird am Telefon,
        <br />
        nicht am Schreibtisch.
      </Title>
      <Spacer />
      <BarList
        items={[
          // A narrow no-break space before the unit, as German sets it.
          { label: "Smartphone", value: 68, display: "68 %", highlight: true },
          { label: "Desktop", value: 27, display: "27 %" },
          { label: "Tablet", value: 5, display: "5 %" },
        ]}
      />
      <Source>
        Anteil der Suchen nach lokalen Betrieben je Gerät, eigene Auswertung von 12 Kundenseiten,
        Oktober 2026
      </Source>
    </Slide>
  );
}
