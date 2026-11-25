import { Deck, Slide, type SlideProps, Title } from "@lanfermann/ui/slides";

// The forms notes can take. Two are plain text and can be left out of a build for an audience;
// two cannot be known for certain (a computed value, a spread), so the check refuses them; one
// stands inside a part of the deck's own, where no player reads it.
const ground: SlideProps = { ground: "tint" };
const spoken = "Aus einer Konstante: der Text steht nicht an der Folie selbst.";

function Zwischenruf({ id }: { id: string }) {
  return (
    <Slide id={id} notes="NOTE-CANARY-NESTED Notizen in einem Bauteil liest der Player nie.">
      <Title>Ein Bauteil, das eine Folie zurückgibt.</Title>
    </Slide>
  );
}

export default (
  <Deck title="Formen von Notizen">
    <Slide id="wort" notes="Als Wort: so stehen Notizen an einer Folie.">
      <Title>Notizen als Wort.</Title>
    </Slide>
    <Slide id="vorlage" notes={`Als Vorlage ohne Platzhalter: auch das ist reiner Text.`}>
      <Title>Notizen als Vorlage.</Title>
    </Slide>
    <Slide id="ausdruck" notes={spoken}>
      <Title>Notizen als Ausdruck.</Title>
    </Slide>
    <Slide id="streuung" {...ground}>
      <Title>Eine Folie mit gestreuten Eigenschaften.</Title>
    </Slide>
    <Zwischenruf id="bauteil" />
  </Deck>
);
