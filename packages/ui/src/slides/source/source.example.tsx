import { Body } from "@/slides/body/body";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** A claim and, as the last block of the slide, where it comes from. */
export function SourceExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={2}>
      <Title>Kunden sehen online nach, bevor sie anrufen.</Title>
      <Spacer />
      <Body>96&#8239;% recherchieren lokale Betriebe online, bevor sie Kontakt aufnehmen.</Body>
      <Source>Quelle: BrightLocal, Local Consumer Review Survey 2024</Source>
    </Slide>
  );
}
