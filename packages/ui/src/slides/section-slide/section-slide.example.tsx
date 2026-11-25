import { SectionSlide } from "@/slides/section-slide/section-slide";

/** The opener of the second of four parts. */
export function SectionSlideExample() {
  return (
    <SectionSlide
      deck="Der digitale Handschlag"
      page={7}
      part={2}
      parts={4}
      title="Was Ihre Website über Sie sagt."
      lead={
        <>
          Drei Betriebe aus Ihrer Nachbarschaft,
          <br />
          mit den Augen eines Kunden gesehen.
        </>
      }
    />
  );
}
