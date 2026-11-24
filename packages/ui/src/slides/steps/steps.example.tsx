import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Steps } from "@/slides/steps/steps";
import { Title } from "@/slides/title/title";

/** Four weeks from the analysis to the new site, each step with the week it happens in. */
export function StepsExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={7}>
      <Title>
        In vier Wochen von der Analyse
        <br />
        zur neuen Seite.
      </Title>
      <Spacer />
      <Steps
        items={[
          { when: "Woche 1", title: "Analyse", text: "Ich prüfe Ihre Seite und drei Mitbewerber." },
          {
            when: "Woche 2",
            title: "Entwurf",
            text: "Sie sehen die Startseite mit Ihren Texten und Fotos.",
          },
          { when: "Woche 3", title: "Umsetzung", text: "Alle Seiten entstehen, Sie geben frei." },
          {
            when: "Woche 4",
            title: "Start",
            text: "Die Seite geht live, das Google-Profil zieht mit.",
          },
        ]}
      />
    </Slide>
  );
}
