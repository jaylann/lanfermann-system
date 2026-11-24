import { Compare } from "@/slides/compare/compare";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** Today and after: three things, each as it is and as it will be. */
export function CompareExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={9}>
      <Title>Was sich für Ihre Kunden ändert.</Title>
      <Spacer />
      <Compare
        left="Heute"
        right="Mit der neuen Seite"
        rows={[
          ["Die Telefonnummer steht im Impressum.", "Ein Tipp auf die Nummer startet den Anruf."],
          ["Die Startseite lädt in sieben Sekunden.", "Sie lädt in unter zwei."],
          [
            "Anfragen kommen nur zu den Öffnungszeiten.",
            "Das Formular nimmt sie rund um die Uhr an.",
          ],
        ]}
      />
    </Slide>
  );
}
