import { Lead } from "@/slides/lead/lead";
import { Slide } from "@/slides/slide/slide";
import { Title } from "@/slides/title/title";

/** Title and lead: the finding as a sentence, broken by hand, and one sentence that carries it on. */
export function TitleExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={2} forms="edge">
      <Title>
        Ihre Kunden prüfen Sie,
        <br />
        bevor sie anrufen.
      </Title>
      <Lead>Wer online nichts findet, ruft beim Nächsten an.</Lead>
    </Slide>
  );
}
