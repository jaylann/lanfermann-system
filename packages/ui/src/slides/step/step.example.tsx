import { Body } from "@/slides/body/body";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Step } from "@/slides/step/step";
import { Takeaway } from "@/slides/takeaway/takeaway";
import { Title } from "@/slides/title/title";

/** The observation stands; the remedy appears on the first click, the conclusion on the second. */
export function StepExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={9}>
      <Title>
        Wer nicht zurückruft,
        <br />
        gibt die Anfrage an den Nächsten weiter.
      </Title>
      <Spacer />
      <Body>
        Die Anfrage kommt am Abend, der Rückruf erst nach zwei Tagen. Bis dahin hat der Kunde beim
        nächsten Betrieb auf der Liste angerufen.
      </Body>
      <Step at={1}>
        <Body>
          Ein fester Rückruf am selben Tag, eingetragen wie ein Termin, hält die Anfrage bei Ihnen.
        </Body>
      </Step>
      <Step at={2}>
        <Takeaway>Der schnelle Rückruf ist Ihre günstigste Werbung.</Takeaway>
      </Step>
    </Slide>
  );
}
