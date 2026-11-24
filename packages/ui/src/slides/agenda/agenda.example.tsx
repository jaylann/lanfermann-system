import { Agenda } from "@/slides/agenda/agenda";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** The agenda of a deck in four parts, each with the page it starts on. */
export function AgendaExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={2}>
      <Title>Worum es heute geht.</Title>
      <Spacer />
      <Agenda
        items={[
          ["Wie Kunden heute einen Betrieb auswählen", 3],
          ["Was Ihre Website dabei über Sie sagt", 7],
          ["Drei Stellen, an denen Anfragen verloren gehen", 11],
          ["Was eine neue Seite kostet und bringt", 15],
        ]}
      />
    </Slide>
  );
}
