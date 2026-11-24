import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Tiers } from "@/slides/tiers/tiers";
import { Title } from "@/slides/title/title";

/**
 * Three offers side by side, the recommended one with its price in the accent. The space before
 * every euro sign is the narrow no-break space (U+202F), not a plain one.
 */
export function TiersExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={9}>
      <Title>Drei Wege, je nachdem, wo Sie stehen.</Title>
      <Spacer />
      <Tiers
        items={[
          {
            name: "Auffrischung",
            price: "1.900 €",
            unit: "einmalig",
            text: "Ihre Seite bleibt, sie wird schnell und mobil.",
            includes: [
              "Ladezeit und Mobilansicht",
              "Telefon und Anfrage im Kopf",
              "Google-Profil eingerichtet",
            ],
          },
          {
            name: "Neue Website",
            price: "3.400 €",
            unit: "einmalig",
            text: "Meine Empfehlung für die meisten Betriebe.",
            recommended: true,
            includes: [
              "Alles aus der Auffrischung",
              "Neue Gestaltung, fünf Seiten",
              "Texte und Fotos vor Ort",
            ],
          },
          {
            name: "Website mit Abläufen",
            price: "5.800 €",
            unit: "einmalig",
            text: "Wenn Anfragen heute auf Zetteln landen.",
            includes: [
              "Alles aus der neuen Website",
              "Terminanfrage mit Kalender",
              "Angebote aus einer Vorlage",
            ],
          },
        ]}
      />
    </Slide>
  );
}
