import { BrowserFrame } from "@/slides/browser-frame/browser-frame";
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
        <BrowserFrame
          url="ihr-betrieb.de"
          markers={[
            { n: 1, x: 776, y: 76 },
            { n: 2, x: 448, y: 212 },
            { n: 3, x: 96, y: 412 },
          ]}
        />
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
