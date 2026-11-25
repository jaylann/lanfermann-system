import { Diagram } from "@/slides/diagram/diagram";
import { ICONS, MARKS } from "@/slides/icon/icons";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** An architecture in three columns: what goes in, what runs on the device, what comes out. */
export function DiagramExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={16}>
      <Title>Nur das Training verlässt das Gerät.</Title>
      <Spacer />
      <Diagram
        alt="Architektur des Sprachagenten: App, Modell und Notizen auf dem Gerät, das Training in der Cloud"
        heads={[
          { span: 3, text: "Eingabe" },
          { span: 5, text: "Auf dem Gerät" },
          { span: 4, text: "Ergebnis" },
        ]}
        nodes={[
          {
            id: "voice",
            col: 1,
            row: 1,
            icon: ICONS.microphone,
            title: "Sprache",
            text: "„Setz Milch auf die Liste“",
          },
          {
            id: "text",
            col: 1,
            row: 2,
            icon: ICONS.phone,
            title: "Text",
            text: "getippt in der App",
          },
          {
            id: "agent",
            col: 4,
            row: 1,
            span: 5,
            rows: 2,
            tone: "accent",
            items: [
              { icon: ICONS.file, title: "Transkript", text: "Whisper, 39 Mio. Parameter" },
              {
                icon: ICONS.tools,
                title: "Werkzeugaufruf",
                text: "Qwen 3.5 mit 4 Mrd. Parametern, 4 Bit",
              },
            ],
          },
          {
            id: "note",
            col: 9,
            row: 1,
            span: 4,
            icon: MARKS.obsidian,
            title: "Obsidian",
            text: "Notiz im Ordner Haushalt",
          },
          {
            id: "log",
            col: 9,
            row: 2,
            span: 4,
            icon: ICONS.database,
            title: "Protokoll",
            text: "jeder Aufruf, lokal gespeichert",
          },
          {
            id: "train",
            col: 4,
            row: 3,
            span: 5,
            tone: "quiet",
            icon: ICONS.cloud,
            title: "Training",
            text: "einmalig, auf einer gemieteten GPU",
          },
        ]}
        edges={[
          { from: "voice", to: "agent" },
          { from: "text", to: "agent" },
          { from: "agent", to: "note" },
          { from: "agent", to: "log" },
          { from: "train", to: "agent", dashed: true, label: "Modell als Datei" },
        ]}
      />
      <Source>Aufbau des Sprachagenten, Stand November 2026</Source>
    </Slide>
  );
}
