import { BeforeAfter } from "@/slides/before-after/before-after";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** The same start page four weeks apart, with one marker on the new side where it changed. */
export function BeforeAfterExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={10}>
      <Title>Dieselbe Startseite, vier Wochen später.</Title>
      <Spacer />
      <BeforeAfter
        before={{ url: "schreinerei-mustermann.de" }}
        after={{ url: "schreinerei-mustermann.de", markers: [{ n: 1, x: 640, y: 76 }] }}
      />
      <Source>Aufnahmen vom 1.7. und 1.8.2026, Desktop, 1440 px</Source>
    </Slide>
  );
}
