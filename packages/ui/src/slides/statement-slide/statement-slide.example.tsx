import { StatementSlide } from "@/slides/statement-slide/statement-slide";

/** The thesis of a deck, as one sentence on Ink. */
export function StatementSlideExample() {
  return (
    <StatementSlide deck="Der digitale Handschlag" page={6}>
      Vertrauen entsteht,
      <br />
      bevor das Telefon klingelt.
    </StatementSlide>
  );
}
