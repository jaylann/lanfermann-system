import { Body } from "@/slides/body/body";
import { Meta } from "@/slides/meta/meta";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { Title } from "@/slides/title/title";

/** Two blocks side by side on six columns each, standing on the same bottom line. */
export function SplitExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={6}>
      <Title>Gefunden werden und überzeugen gehören zusammen.</Title>
      <Spacer />
      <Split ratio="6|6">
        <div className="flex flex-col gap-2">
          <Meta>Sichtbarkeit</Meta>
          <Body>
            Google-Profil, Bewertungen und lokale Suche, damit man Sie in Ihrem Viertel findet.
          </Body>
        </div>
        <div className="flex flex-col gap-2">
          <Meta>Website</Meta>
          <Body>
            Eine schnelle, klare Seite, die Anfragen bringt und auf dem Smartphone funktioniert.
          </Body>
        </div>
      </Split>
    </Slide>
  );
}
