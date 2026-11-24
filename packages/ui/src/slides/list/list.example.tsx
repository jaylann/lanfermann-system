import { List } from "@/slides/list/list";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** A plain list of four rows, each opened by the sentence that names it. */
export function ListExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={5}>
      <Title>Was eine gute Handwerker-Seite leistet.</Title>
      <Spacer />
      <List
        items={[
          <>
            <b>Sie sagt sofort, was Sie tun und wo.</b> Ohne Scrollen, ohne Slogan.
          </>,
          <>
            <b>Sie macht den Anruf leicht.</b> Die Nummer steht oben und lässt sich antippen.
          </>,
          <>
            <b>Sie zeigt Ihre Arbeit.</b> Echte Fotos von echten Projekten, keine Agenturbilder.
          </>,
          <>
            <b>Sie lädt schnell.</b> Auch im Mobilfunknetz auf der Baustelle.
          </>,
        ]}
      />
    </Slide>
  );
}
