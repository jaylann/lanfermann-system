import { Body } from "@/slides/body/body";
import { Meta } from "@/slides/meta/meta";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** Meta as a label over what it names, and as the note at the foot of the slide. */
export function MetaExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={9}>
      <Title>Dieselbe Anfrage, vorher und nachher.</Title>
      <Spacer />
      <div className="flex flex-col gap-2">
        <Meta>Vorher</Meta>
        <Body>Der Kunde ruft nach Feierabend an und erreicht niemanden.</Body>
      </div>
      <div className="flex flex-col gap-2">
        <Meta>Nachher</Meta>
        <Body>Der Kunde schreibt über das Formular und bekommt am nächsten Morgen Antwort.</Body>
      </div>
      <Meta>Ablauf einer Anfrage nach Feierabend, ohne und mit Anfrageformular</Meta>
    </Slide>
  );
}
