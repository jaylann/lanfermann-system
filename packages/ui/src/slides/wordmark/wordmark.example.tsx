import { Forms } from "@/slides/forms/forms";
import { Lead } from "@/slides/lead/lead";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";
import { Wordmark } from "@/slides/wordmark/wordmark";

/** A cover on Ink: the drawn wordmark at 32px, pinned to the top left corner of the margins. */
export function WordmarkExample() {
  return (
    <Slide ground="ink" footer={false} gap={48}>
      <Forms name="rise" />
      <Wordmark size={32} style={{ position: "absolute", left: 128, top: 128 }} />
      <Spacer />
      <Title size="cover">
        Der digitale
        <br />
        Handschlag.
      </Title>
      <Lead>
        Warum Ihre nächsten 100 Kunden Sie googeln,
        <br />
        bevor Sie sie je treffen.
      </Lead>
    </Slide>
  );
}
