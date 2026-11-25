import { Columns } from "@/slides/columns/columns";
import { ICONS } from "@/slides/icon/icons";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** Three services of equal rank, each with its icon before the title. */
export function ColumnsExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={6} forms="corner">
      <Title>Drei Dinge, die ich für Betriebe übernehme.</Title>
      <Spacer />
      <Columns
        items={[
          {
            icon: ICONS.browser,
            title: "Website",
            text: "Eine schnelle, klare Seite, die Anfragen bringt und auf dem Smartphone funktioniert.",
          },
          {
            icon: ICONS.search,
            title: "Sichtbarkeit",
            text: "Google-Profil, Bewertungen und lokale Suche, damit man Sie in Ihrem Viertel findet.",
          },
          {
            icon: ICONS.cycle,
            title: "Automatisierung",
            text: "Terminanfragen, Angebote und Rückrufe, die ohne Zettelwirtschaft laufen.",
          },
        ]}
      />
    </Slide>
  );
}
