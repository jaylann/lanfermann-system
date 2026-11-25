import { Example } from "@/slides/example/example";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** A claim about a system made concrete on Ink: what a user says, and the call it becomes. */
export function ExampleExample() {
  return (
    <Slide ground="ink" deck="Der digitale Handschlag" page={9}>
      <Title>
        Die App versteht den Satz
        <br />
        und führt ihn aus.
      </Title>
      <Spacer />
      <Example
        input="„Schieb die Einkaufsliste in den Ordner Haushalt.“"
        output='update(notiz: "Einkaufsliste", ordner: "Haushalt")'
        caption="Qwen 3.5 mit 4 Mrd. Parametern, lokal auf dem Smartphone"
      />
    </Slide>
  );
}
