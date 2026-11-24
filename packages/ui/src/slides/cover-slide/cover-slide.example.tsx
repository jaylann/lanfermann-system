import { CoverSlide } from "@/slides/cover-slide/cover-slide";

/** The cover of a deck for a trade: title, one sentence, for whom and by whom. */
export function CoverSlideExample() {
  return (
    <CoverSlide
      title={
        <>
          Der digitale
          <br />
          Handschlag.
        </>
      }
      lead={
        <>
          Warum Ihre nächsten 100 Kunden Sie googeln,
          <br />
          bevor Sie sie je treffen.
        </>
      }
      audience="Für Münchner Handwerk und Traditionsbetriebe"
      byline="Justin Lanfermann, November 2026"
    />
  );
}
