import { KeyValue } from "@/slides/key-value/key-value";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** The scope of an offer: four terms, one sentence each. */
export function KeyValueExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={7}>
      <Title>Was Sie für die Analyse bekommen.</Title>
      <Spacer />
      <KeyValue
        items={[
          [
            "Bestandsaufnahme",
            "Ich prüfe Ihre Website auf dem Smartphone und am Rechner, so wie ein Kunde sie sieht.",
          ],
          [
            "Vergleich",
            "Drei Betriebe aus Ihrer Nähe und Ihrer Branche, Seite an Seite mit Ihrer.",
          ],
          ["Befund", "Die Stellen, an denen Ihnen Anfragen entgehen, mit Screenshot und Beleg."],
          [
            "Gespräch",
            "20 Minuten, in denen ich Ihnen zeige, was sich ändern lässt und was es kostet.",
          ],
        ]}
      />
    </Slide>
  );
}
