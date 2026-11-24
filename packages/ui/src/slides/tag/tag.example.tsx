import { Meta } from "@/slides/meta/meta";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Tag, Tags } from "@/slides/tag/tag";
import { Title } from "@/slides/title/title";

/** A row of trades: tags in a row `div` with a 16px gap. */
export function TagExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={4}>
      <Title>Für Betriebe, die von Empfehlungen leben.</Title>
      <Spacer />
      <div className="flex flex-wrap gap-4">
        {[
          "Schreinerei",
          "Bäckerei",
          "Metzgerei",
          "Friseur",
          "Malerbetrieb",
          "Elektro",
          "Sanitär",
          "Steuerkanzlei",
        ].map((trade) => (
          <Tag key={trade}>{trade}</Tag>
        ))}
      </div>
      <Meta>Bisherige Kunden und Gespräche, München und Umland</Meta>
    </Slide>
  );
}

/** A labelled row: a few muted words in front say what the tags are. */
export function TagsExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={4}>
      <Title>Jede Seite wird auf dieselben Dinge geprüft.</Title>
      <Spacer />
      <Tags
        label="Geprüft wird"
        items={["Ladezeit", "Lesbarkeit am Smartphone", "Kontaktweg", "Google-Profil", "Impressum"]}
      />
      <Meta>Prüfliste der Analyse, Stand November 2026</Meta>
    </Slide>
  );
}
