import { CoBrand } from "@/slides/co-brand/co-brand";
import { Forms } from "@/slides/forms/forms";
import { Lead } from "@/slides/lead/lead";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** A cover made for one client: the lockup stands where the wordmark would, top left. */
export function CoBrandExample() {
  return (
    <Slide ground="ink" footer={false} gap={48}>
      <Forms name="rise" />
      <div className="absolute top-32 left-32 flex h-8 slide-span-7">
        <CoBrand partner="Schreinerei Mustermann" />
      </div>
      <Spacer />
      <Title size="cover">
        Ihre Website,
        <br />
        neu gedacht.
      </Title>
      <Lead>
        Analyse, Vorschlag und Festpreis
        <br />
        für die Schreinerei Mustermann.
      </Lead>
    </Slide>
  );
}
