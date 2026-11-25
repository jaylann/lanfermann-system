import { Quote } from "@/slides/quote/quote";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";

/** A customer's sentence on Tint, in place of a title, signed with name and role. */
export function QuoteExample() {
  return (
    <Slide ground="tint" deck="Der digitale Handschlag" page={13} forms="corner">
      <Spacer />
      <Quote name="Max Mustermann" role="Inhaber, Schreinerei Mustermann">
        „Seit der neuen Seite rufen Leute an,
        <br />
        die uns vorher nie gefunden hätten.“
      </Quote>
    </Slide>
  );
}
