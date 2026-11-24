import { Objections } from "@/slides/objections/objections";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** Three objections on Tint, each in the customer's words beside its answer. */
export function ObjectionsExample() {
  return (
    <Slide ground="tint" deck="Der digitale Handschlag" page={8}>
      <Title>Was ich in fast jedem Gespräch höre.</Title>
      <Spacer />
      <Objections
        items={[
          {
            quote: "„Wir leben von Empfehlungen.“",
            answer:
              "Auch wer empfohlen wird, wird gesucht. Die Empfehlung endet auf Ihrer Website.",
          },
          {
            quote: "„Wir haben doch schon eine Seite.“",
            answer: "Die Frage ist, ob sie auf dem Smartphone in drei Sekunden sagt, was Sie tun.",
          },
          {
            quote: "„Dafür haben wir keine Zeit.“",
            answer: "Ich brauche von Ihnen zwei Stunden: ein Gespräch und eine Freigabe.",
          },
        ]}
      />
    </Slide>
  );
}
