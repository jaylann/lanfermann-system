import { Body } from "@/slides/body/body";
import { Meta } from "@/slides/meta/meta";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** Body copy beside nothing: a short paragraph on six columns, with its one bold sentence. */
export function BodyExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={3} forms="halo">
      <Title>Eine Website ist heute der erste Eindruck.</Title>
      <Spacer />
      <Body>
        Bevor jemand anruft, hat er Ihren Namen gesucht, die Bewertungen gelesen und Ihre Seite
        geöffnet. <b>Dort fällt die Entscheidung.</b>
      </Body>
      <Meta>Aus 14 Gesprächen mit Münchner Betrieben, Oktober 2026</Meta>
    </Slide>
  );
}
