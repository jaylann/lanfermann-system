import { Deck, Slide, Title } from "@lanfermann/ui/slides";

// Wrong on purpose, in every way the layout check knows: the types are fine and the file
// builds, but every slide except the last breaks one rule of the canvas.
function Boom(): never {
  throw new Error("Kaputt");
}

export default (
  <Deck title="Kaputt">
    <Slide id="wrap">
      <Title>
        Ein Titel, der viel zu lang ist und deshalb über drei ganze Zeilen läuft, was er nicht darf,
        weil zwei genug sind.
      </Title>
    </Slide>
    <Slide id="overflow">
      <Title>Zu viel.</Title>
      <div id="zu-hoch" style={{ height: 900, flex: "none" }} />
    </Slide>
    <Slide id="placed">
      <Title>Daneben.</Title>
      <div
        id="daneben"
        style={{ position: "absolute", left: 1800, top: 500, width: 300, height: 100 }}
      />
    </Slide>
    <Slide id="clipped">
      <Title>Abgeschnitten.</Title>
      <p id="kasten" style={{ width: 300, overflow: "hidden", whiteSpace: "nowrap" }}>
        Ein Satz, der nicht in seinen Kasten passt und abgeschnitten wird.
      </p>
    </Slide>
    <Slide id="nowrap">
      <Title>Hinaus.</Title>
      <p id="lang" style={{ width: 300, whiteSpace: "nowrap" }}>
        {"Ein Satz, der aus seinem Kasten und aus der Folie läuft. ".repeat(4)}
      </p>
    </Slide>
    <Slide id="throws">
      <Boom />
    </Slide>
    <div id="no-slide">Keine Folie</div>
    <Slide id="fine">
      <Title>In Ordnung.</Title>
    </Slide>
  </Deck>
);
