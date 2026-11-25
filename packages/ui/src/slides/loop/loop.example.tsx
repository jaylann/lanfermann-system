import { Findings } from "@/slides/findings/findings";
import { Loop } from "@/slides/loop/loop";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { Title } from "@/slides/title/title";

/** A loop of eight steps on eight columns, beside the two findings its markers point to. */
export function LoopExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={17}>
      <Title>
        Nach dem Start wird gemessen
        <br />
        und nachgebessert.
      </Title>
      <Spacer />
      <Split ratio="8|4" align="end">
        <Loop
          center={{
            label: "Jeden Monat",
            title: (
              <>
                Ein Durchlauf,
                <br />
                eine Änderung.
              </>
            ),
            text: "gemessen an den Anfragen",
          }}
          steps={[
            { title: "Messen" },
            { title: "Auswerten" },
            { title: "Entscheiden", highlight: true, marker: 1 },
            { title: "Entwerfen" },
            { title: "Umsetzen" },
            { title: "Prüfen", marker: 2 },
            { title: "Veröffentlichen" },
            { title: "Beobachten" },
          ]}
        />
        <Findings
          items={[
            {
              title: "Sie entscheiden.",
              text: "Ich schlage eine Änderung vor, Sie sagen ja oder nein.",
            },
            {
              title: "Nichts geht ungeprüft live.",
              text: "Smartphone, Tablet, Rechner, jedes Mal.",
            },
          ]}
        />
      </Split>
    </Slide>
  );
}
