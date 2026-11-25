import { FigureRow } from "@/slides/figure-row/figure-row";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** Three figures read against each other, each with its own source, one of them in the accent. */
export function FigureRowExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={3} forms="bend">
      <Title>
        Der erste Eindruck entsteht online,
        <br />
        und er entsteht schnell.
      </Title>
      <Spacer />
      <FigureRow
        items={[
          {
            value: "96",
            unit: "%",
            label: "recherchieren lokale Betriebe online, bevor sie Kontakt aufnehmen.",
            source: "BrightLocal 2024",
            highlight: true,
          },
          {
            value: "0,05",
            unit: "Sek.",
            label: "genügen für ein erstes Urteil über eine Website.",
            source: "Lindgaard et al. 2006",
          },
          {
            value: "53",
            unit: "%",
            label: "verlassen eine mobile Seite, die länger als drei Sekunden lädt.",
            source: "Google 2016",
          },
        ]}
      />
    </Slide>
  );
}
