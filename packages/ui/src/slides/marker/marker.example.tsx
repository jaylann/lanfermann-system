import { Findings } from "@/slides/findings/findings";
import { PhoneFrame } from "@/slides/phone-frame/phone-frame";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { Title } from "@/slides/title/title";

/** Each number stands twice: pinned on the screenshot, and beside the finding it points at. */
export function MarkerExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={8}>
      <Title>Am Smartphone bremsen drei Stellen.</Title>
      <Spacer />
      <Split ratio="4|8" align="end">
        <PhoneFrame
          markers={[
            { n: 1, x: 152, y: 12 },
            { n: 2, x: 88, y: 152 },
            { n: 3, x: 88, y: 376 },
          ]}
        />
        <Findings
          items={[
            {
              title: "Das Menü ist kleiner als ein Finger.",
              text: "Wer daneben tippt, landet auf der falschen Seite.",
            },
            {
              title: "Das Startbild zeigt keine Arbeit von Ihnen.",
              text: "Ein Agenturfoto sagt nichts über Ihren Betrieb.",
            },
            {
              title: "Der Text ist zu klein zum Lesen.",
              text: "Wer zoomen muss, geht zur nächsten Seite.",
            },
          ]}
        />
      </Split>
      <Source>Aufnahme vom 11.11.2026, iPhone, Mobilfunknetz</Source>
    </Slide>
  );
}
