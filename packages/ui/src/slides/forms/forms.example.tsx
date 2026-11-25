import { Body } from "@/slides/body/body";
import { Forms } from "@/slides/forms/forms";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** A content slide with room: the quarter disc in the corner, first in the markup. */
export function FormsExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={6}>
      <Forms name="corner" />
      <Title>Drei Dinge, die ich für Betriebe übernehme.</Title>
      <Spacer />
      <Body>
        Eine schnelle Website, ein gepflegtes Google-Profil und Anfragen, die ohne Zettelwirtschaft
        laufen.
      </Body>
    </Slide>
  );
}
