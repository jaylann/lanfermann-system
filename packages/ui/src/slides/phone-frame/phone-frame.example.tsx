import { Findings } from "@/slides/findings/findings";
import { PhoneFrame } from "@/slides/phone-frame/phone-frame";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { Title } from "@/slides/title/title";

/** A finding about the mobile page: the phone on four columns, its two findings on eight. */
export function PhoneFrameExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={5}>
      <Title>
        Auf dem Smartphone fehlt
        <br />
        der Weg zum Anruf.
      </Title>
      <Spacer />
      <Split ratio="4|8" align="end">
        <PhoneFrame
          markers={[
            { n: 1, x: 152, y: 12 },
            { n: 2, x: 88, y: 152 },
          ]}
        />
        <Findings
          items={[
            {
              title: "Keine Telefonnummer im Kopf.",
              text: "Das Menü verbirgt sie hinter zwei Tipps.",
            },
            {
              title: "Das Startbild füllt den ganzen Bildschirm.",
              text: "Was der Betrieb anbietet, steht erst darunter.",
            },
          ]}
        />
      </Split>
      <Source>Aufnahme vom 11.11.2026, iPhone, Mobilfunknetz</Source>
    </Slide>
  );
}
