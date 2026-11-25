import { Flow } from "@/slides/flow/flow";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** A flow of four steps, with the accent edge on the step the title is about. */
export function FlowExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={15}>
      <Title>Aus einem Satz wird ein Eintrag in Ihrer Notiz.</Title>
      <Spacer />
      <Flow
        nodes={[
          { title: "Sprache", text: "„Setz Milch auf die Liste“" },
          { title: "Transkript", text: "Whisper, auf dem Gerät" },
          { title: "Werkzeugaufruf", text: "Qwen 3.5 wählt update()", highlight: true },
          { title: "Notiz", text: "Obsidian, Ordner Haushalt" },
        ]}
      />
      <Source>Ablauf des Sprachagenten, alle Schritte laufen lokal</Source>
    </Slide>
  );
}
