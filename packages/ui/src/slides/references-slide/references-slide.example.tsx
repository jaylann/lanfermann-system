import { ReferencesSlide } from "@/slides/references-slide/references-slide";

/** The sources of a deck, in the order it cites them. */
export function ReferencesSlideExample() {
  return (
    <ReferencesSlide
      deck="Der digitale Handschlag"
      page={18}
      items={[
        { by: "BrightLocal", title: "Local Consumer Review Survey", year: "2024" },
        {
          by: "Lindgaard et al.",
          title:
            "Attention web designers: You have 50 milliseconds to make a good first impression",
          year: "2006",
        },
        { by: "Google", title: "The need for mobile speed", year: "2016" },
        {
          by: "Eigene Auswertung",
          title: "Suchen nach lokalen Betrieben je Gerät, 12 Kundenseiten",
          year: "2026",
        },
      ]}
    />
  );
}
