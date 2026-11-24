import { Body } from "@/slides/body/body";
import { Media } from "@/slides/media/media";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { Title } from "@/slides/title/title";

/** A photo on six columns with its caption, beside the two sentences that say why it is there. */
export function MediaExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={11}>
      <Title>Echte Fotos schlagen jedes Agenturbild.</Title>
      <Spacer />
      <Split ratio="6|6" align="end">
        <Media caption="Werkstatt der Schreinerei Mustermann, Oktober 2026">
          Foto: Werkstatt, Querformat
        </Media>
        <Body>
          Wer Ihre Werkstatt sieht, weiß in einer Sekunde, mit wem er es zu tun hat. Ich
          fotografiere bei Ihnen vor Ort, an einem Vormittag.
        </Body>
      </Split>
    </Slide>
  );
}
