import { Deck, Media, Slide, Source, Spacer, Title } from "@lanfermann/ui/slides";

import punkt from "./bilder/punkt.png";
import { Werkbank } from "./parts/werkbank";

// A deck with files of its own: a part in a subfolder, and two pictures. In the built file
// both pictures are data URLs, so the file still loads nothing.
export default (
  <Deck title="Bilder und eigene Bauteile">
    <Slide id="werkbank" notes="Das Bild kommt aus dem Ordner der Präsentation.">
      <Title>Ein Bild liegt neben der Präsentation.</Title>
      <Spacer />
      <Werkbank />
      <Source>Zeichnung: eigene Datei, als SVG</Source>
    </Slide>
    <Slide id="punkt" notes="Ein PNG von einem Pixel, zum Prüfen.">
      <Title>Auch ein PNG wird Teil der Datei.</Title>
      <Spacer />
      <Media src={punkt} alt="Ein einzelner Bildpunkt" caption="Ein Bildpunkt, stark vergrößert" />
    </Slide>
  </Deck>
);
