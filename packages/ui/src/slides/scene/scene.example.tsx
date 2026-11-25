import { ICONS } from "@/slides/icon/icons";
import { Scene } from "@/slides/scene/scene";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/**
 * A craft business's way from being found to the next inquiry, in three beats: the whole way, the
 * inquiry close up, the loop that brings the next customer. As a still it shows the last beat.
 */
export function SceneExample() {
  return (
    <Slide ground="ink" deck="Der digitale Handschlag" page={9}>
      <Title>
        Aus der Suche wird ein Auftrag,
        <br />
        aus dem Auftrag die nächste Suche.
      </Title>
      <Spacer />
      <Scene
        alt="Der Weg eines Kunden in drei Stationen: gefunden werden über Google-Profil, Bewertungen und Website; die Anfrage über Formular oder Anruf, mit Rückruf und Termin; der Abschluss mit Angebot, Zusage und Rechnung, danach die Bitte um eine Bewertung, die zur nächsten Suche führt."
        world={{
          nodes: [
            {
              id: "google",
              label: "Google-Profil",
              detail: "Karte, Zeiten, Fotos",
              icon: ICONS.pin,
              col: 1,
              row: 1,
            },
            {
              id: "bewertungen",
              label: "Bewertungen",
              detail: "4,8 Sterne aus 63",
              icon: ICONS.star,
              col: 1,
              row: 2,
            },
            {
              id: "website",
              label: "Website",
              detail: "Leistungen, Preise",
              icon: ICONS.browser,
              col: 2,
              row: 1,
            },
            {
              id: "referenzen",
              label: "Referenzen",
              detail: "echte Baustellen",
              icon: ICONS.image,
              col: 2,
              row: 2,
            },
            {
              id: "formular",
              label: "Formular",
              detail: "drei Felder",
              icon: ICONS.mail,
              col: 3,
              row: 1,
            },
            {
              id: "anruf",
              label: "Anruf",
              detail: "Nummer im Kopf",
              icon: ICONS.phone,
              col: 3,
              row: 2,
            },
            {
              id: "rueckruf",
              label: "Rückruf",
              detail: "am selben Werktag",
              icon: ICONS.call,
              col: 4,
              row: 1,
            },
            {
              id: "termin",
              label: "Termin",
              detail: "online gebucht",
              icon: ICONS.calendar,
              col: 4,
              row: 2,
            },
            {
              id: "angebot",
              label: "Angebot",
              detail: "als PDF am Abend",
              icon: ICONS.file,
              tone: "solid",
              col: 5,
              row: 1,
            },
            {
              id: "nachfrage",
              label: "Nachfrage",
              detail: "eine Woche danach",
              icon: ICONS.chat,
              col: 5,
              row: 2,
            },
            {
              id: "zusage",
              label: "Zusage",
              detail: "per Klick im PDF",
              icon: ICONS.handshake,
              col: 6,
              row: 1,
            },
            {
              id: "rechnung",
              label: "Rechnung",
              detail: "mit Zahllink",
              icon: ICONS.euro,
              col: 6,
              row: 2,
            },
          ],
          groups: [
            {
              id: "gefunden",
              label: "Gefunden werden",
              nodes: ["google", "bewertungen", "website", "referenzen"],
            },
            { id: "anfrage", label: "Anfrage", nodes: ["formular", "anruf", "rueckruf", "termin"] },
            {
              id: "abschluss",
              label: "Abschluss",
              nodes: ["angebot", "nachfrage", "zusage", "rechnung"],
            },
          ],
          wires: [
            { from: "google", to: "website" },
            { from: "bewertungen", to: "website" },
            { from: "referenzen", to: "website" },
            { from: "website", to: "formular" },
            { from: "website", to: "anruf" },
            { from: "formular", to: "rueckruf" },
            { from: "anruf", to: "termin" },
            { from: "rueckruf", to: "termin" },
            { from: "rueckruf", to: "angebot" },
            { from: "termin", to: "angebot" },
            { from: "angebot", to: "zusage" },
            { from: "zusage", to: "rechnung" },
            { from: "rechnung", to: "nachfrage" },
            { from: "nachfrage", to: "bewertungen", dashed: true },
          ],
        }}
        beats={[
          {
            view: "all",
            caption: (
              <>
                <b>Drei Stationen.</b> Gefunden werden, die Anfrage annehmen, den Auftrag
                abschließen.
              </>
            ),
          },
          {
            view: "anfrage",
            highlight: ["formular", "rueckruf"],
            caption: (
              <>
                <b>Die Anfrage</b> kommt über drei Felder, der Rückruf noch am selben Werktag.
              </>
            ),
          },
          {
            view: "all",
            loop: [
              "bewertungen",
              "website",
              "formular",
              "rueckruf",
              "angebot",
              "zusage",
              "rechnung",
              "nachfrage",
            ],
            caption: (
              <>
                <b>Der Kreis schließt sich:</b> Eine Woche nach der Rechnung bittet der Betrieb um
                eine Bewertung, und die nächste Suche findet ihn.
              </>
            ),
          },
        ]}
      />
    </Slide>
  );
}
