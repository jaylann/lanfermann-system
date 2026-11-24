import { Body } from "@/slides/body/body";
import { Marker } from "@/slides/marker/marker";
import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Split } from "@/slides/split/split";
import { Title } from "@/slides/title/title";

/** Each number stands twice: pinned on the evidence, and beside the finding it points at. */
export function MarkerExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={8}>
      <Title>Drei Stellen kosten Sie heute Anfragen.</Title>
      <Spacer />
      <Split ratio="7|5">
        <div className="relative flex h-[520px] flex-col gap-6 rounded-[4px] border border-line bg-surface p-8">
          <div className="h-8 w-48 rounded-[2px] bg-surface-quiet" />
          <div className="min-h-0 flex-1 rounded-[2px] bg-surface-quiet" />
          <div className="h-4 w-96 rounded-[2px] bg-surface-quiet" />
          <Marker n={1} style={{ position: "absolute", left: 824, top: 24 }} />
          <Marker n={2} style={{ position: "absolute", left: 448, top: 243 }} />
          <Marker n={3} style={{ position: "absolute", left: 432, top: 454 }} />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-6">
            <Marker n={1} />
            <Body width={512}>Die Telefonnummer fehlt im Kopf.</Body>
          </div>
          <div className="flex items-start gap-6">
            <Marker n={2} />
            <Body width={512}>Das Startbild lädt unkomprimiert.</Body>
          </div>
          <div className="flex items-start gap-6">
            <Marker n={3} />
            <Body width={512}>Kein Weg zur Terminanfrage.</Body>
          </div>
        </div>
      </Split>
      <Source>Analyse vom 11.11.2026, Smartphone und Desktop</Source>
    </Slide>
  );
}
