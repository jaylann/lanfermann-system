import { Figure } from "@/slides/figure/figure";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** One hero figure under its title: the number, its unit, what it measures and its source. */
export function FigureExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={2} forms="edge">
      <Title>
        Ihre Kunden prüfen Sie,
        <br />
        bevor sie anrufen.
      </Title>
      <Spacer />
      <Figure value="96" unit="%" source="Quelle: BrightLocal, Local Consumer Review Survey 2024">
        aller Verbraucher recherchieren lokale Geschäfte online, bevor sie einen Fuß vor die Tür
        setzen.
      </Figure>
    </Slide>
  );
}
