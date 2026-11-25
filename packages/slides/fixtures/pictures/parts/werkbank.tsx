import { Media } from "@lanfermann/ui/slides";

import werkbank from "../bilder/werkbank.svg";

/** The drawing of the workbench in its frame. */
export function Werkbank() {
  return (
    <Media
      src={werkbank}
      alt="Zeichnung einer Werkbank mit Schraubstock"
      caption="Die Werkbank in der Werkstatt, als Zeichnung"
    />
  );
}
