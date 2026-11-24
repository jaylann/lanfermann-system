import { ClosingSlide } from "@/slides/closing-slide/closing-slide";
import { ICONS } from "@/slides/icon/icons";

/** The ask at the end of a deck, with three ways to reach Justin. */
export function ClosingSlideExample() {
  return (
    <ClosingSlide
      title={
        <>
          Eine kostenlose
          <br />
          Analyse.
        </>
      }
      lead={
        <>
          Ich schaue mir an, was Sie haben, was die Konkurrenz macht
          <br />
          und wo die Lücken sind. Unverbindlich.
        </>
      }
      contacts={[
        ["E-Mail", "justin@lanfermann.dev", ICONS.mail],
        ["Web", "lanfermann.dev", ICONS.globe],
        ["Vor Ort", "München, direkt bei Ihnen", ICONS.pin],
      ]}
    />
  );
}
