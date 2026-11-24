import { Deck, Slide, Title } from "@lanfermann/ui/slides";
import lodash from "lodash";

// Wrong on purpose: a deck imports React, the kit and its own files, and nothing else. The
// import above stands on line 2, column 20: the tests look for exactly that place.
export default (
  <Deck title="Ein fremdes Paket">
    <Slide id="fremd">
      <Title>{lodash.capitalize("ein Paket, das eine Folie nicht laden darf.")}</Title>
    </Slide>
  </Deck>
);
