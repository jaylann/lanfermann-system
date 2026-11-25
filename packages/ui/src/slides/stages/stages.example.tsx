import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Stages } from "@/slides/stages/stages";
import { Title } from "@/slides/title/title";

/** Four stages with an approval between each two, and one path back from the third to the second. */
export function StagesExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={8}>
      <Title>
        Sie geben jede Stufe frei,
        <br />
        bevor die nächste beginnt.
      </Title>
      <Spacer />
      <Stages
        gates={[true, true, true]}
        returns={[{ from: 3, to: 2, label: "Änderungswunsch" }]}
        gateNote="Sie geben frei"
        returnNote="zurück, wenn etwas nicht passt"
        items={[
          { label: "Woche 1", title: "Analyse", text: "Ihre Seite und drei Mitbewerber" },
          { label: "Woche 2", title: "Entwurf", text: "die Startseite mit Ihren Texten" },
          { label: "Woche 3", title: "Umsetzung", text: "alle Seiten, auf allen Geräten" },
          { label: "Woche 4", title: "Start", text: "live, mit Google-Profil", highlight: true },
        ]}
      />
    </Slide>
  );
}
