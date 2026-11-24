import { Body } from "@/slides/body/body";
import { BrowserFrame } from "@/slides/browser-frame/browser-frame";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { Title } from "@/slides/title/title";

/** The page as a visitor meets it, whole and with its address, beside what it leaves unsaid. */
export function BrowserFrameExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={3}>
      <Title>So sieht ein Besucher Ihre Startseite.</Title>
      <Spacer />
      <Split ratio="7|5">
        <BrowserFrame url="ihr-betrieb.de" />
        <Body width={656}>
          Ein großes Bild und drei Zeilen Text. Was Sie anbieten, steht erst weiter unten.
        </Body>
      </Split>
      <Source>Aufnahme vom 11.11.2026, Desktop, 1440 px</Source>
    </Slide>
  );
}
