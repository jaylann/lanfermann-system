import { Body } from "@/slides/body/body";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** The Stack frame on Paper: the title on the top margin, the evidence on the bottom one. */
export function SlideExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={2}>
      <Title>
        Der Titel ist ein ganzer Satz
        <br />
        und nennt das Ergebnis.
      </Title>
      <Spacer />
      <Body>
        Der Beleg steht unten auf dem Rand: eine Zahl, eine Tabelle, ein Screenshot. Dazwischen
        bleibt Luft.
      </Body>
      <Source>Quelle oder Methode, in einem Satz</Source>
    </Slide>
  );
}
