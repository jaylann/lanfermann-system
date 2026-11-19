/**
 * For stories only (not exported): an answer that names its sources, and the sources.
 */
import type { Source } from "./source-list";
import { SourceReference } from "./sources";

export const SOURCES: Source[] = [
  {
    title: "Angebot 2026-0421: Website für die Bäckerei Kornprobst",
    url: "https://angebote.lanfermann.dev/2026-0421",
    site: "Angebote",
    excerpt:
      "Website mit Bestellformular für Torten und je einer Seite für die Filialen am Marktplatz, in der Altstadt und in Haidhausen. Gültig bis 15. Dezember 2026.",
  },
  {
    title: "Preisliste 2026 für Websites und Pflege",
    url: "https://www.lanfermann.dev/preise",
    excerpt: "Pflege im ersten Jahr: 40 € im Monat, jährlich abgerechnet. Alle Preise netto.",
  },
  {
    title: "Mail von Anna Kornprobst vom 12. November",
    url: "https://mail.lanfermann.dev/m/2611-kornprobst",
    site: "Mail",
    excerpt:
      "Wir hätten gern zu jeder Filiale die Öffnungszeiten und ein Bild, am liebsten aus der Backstube.",
  },
];

/** The answer, with its references after the sentences they stand for. */
export function SourcedAnswer() {
  return (
    <>
      <p>
        Das Angebot an die <strong>Bäckerei Kornprobst</strong> umfasst eine neue Website mit einem
        Bestellformular für Torten und einer Seite für jede der drei Filialen.
        <SourceReference n={1} /> Zusammen kostet es <strong>5.180 € netto</strong>; die Pflege im
        ersten Jahr ist mit 480 € darin enthalten.
        <SourceReference n={2} />
      </p>
      <p>
        Frau Kornprobst wünscht sich zu jeder Filiale die Öffnungszeiten und ein Bild.
        <SourceReference n={3} /> Das Angebot gilt bis zum 15. Dezember 2026.
        <SourceReference n={1} />
      </p>
    </>
  );
}
