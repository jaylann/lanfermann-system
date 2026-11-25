import { Body } from "@/slides/body/body";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Takeaway } from "@/slides/takeaway/takeaway";
import { Title } from "@/slides/title/title";

/** The title names the finding, the takeaway under the rule says what follows from it. */
export function TakeawayExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={6}>
      <Title>Zwei von drei Anfragen kommen abends.</Title>
      <Spacer />
      <Body>
        Die meisten Interessenten suchen nach Feierabend, wenn im Betrieb niemand mehr ans Telefon
        geht.
      </Body>
      <Takeaway>Ein Anfrageformular arbeitet dann, wenn Sie es nicht können.</Takeaway>
    </Slide>
  );
}
