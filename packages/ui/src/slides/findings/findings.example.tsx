import { Findings } from "@/slides/findings/findings";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { Title } from "@/slides/title/title";

/** Three findings on the narrow side of a split, beside the screenshot their markers point into. */
export function FindingsExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={4}>
      <Title>Drei Stellen kosten Sie heute Anfragen.</Title>
      <Spacer />
      <Split ratio="7|5" align="stretch">
        {/* The wide side takes the `BrowserFrame` of ihr-betrieb.de with the markers 1 to 3 (#85). */}
        <div />
        <Findings
          items={[
            {
              title: "Die Telefonnummer fehlt im Kopf.",
              text: "Wer mobil sucht, will sofort anrufen.",
            },
            {
              title: "Das Startbild lädt unkomprimiert.",
              text: "Auf dem Smartphone bleibt die Seite lange leer.",
            },
            {
              title: "Kein Weg zur Terminanfrage.",
              text: "Interessenten finden kein Formular und keine Zeiten.",
            },
          ]}
        />
      </Split>
      <Source>Analyse vom 11.11.2026, Smartphone und Desktop</Source>
    </Slide>
  );
}
