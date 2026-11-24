import { Lead } from "@/slides/lead/lead";
import { Slide } from "@/slides/slide/slide";
import { Title } from "@/slides/title/title";

/** One muted sentence under the title, where the title needs a second one. */
export function LeadExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={7}>
      <Title>Was Ihre Website über Sie sagt.</Title>
      <Lead>
        Drei Betriebe aus Ihrer Nachbarschaft,
        <br />
        mit den Augen eines Kunden gesehen.
      </Lead>
    </Slide>
  );
}
