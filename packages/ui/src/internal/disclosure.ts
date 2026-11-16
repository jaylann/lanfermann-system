/**
 * A panel that opens under its trigger: the motion an `Accordion` and a `Collapsible` share.
 *
 * It grows to its measured height on `settle` while its content fades in; closing is the faster
 * `leave`. The height itself comes from the part (`--accordion-panel-height`,
 * `--collapsible-panel-height`), so each part adds its own `h-(…)` class.
 *
 * The panel has to clip while it moves, and CSS cannot tell it when it has stopped, so it clips
 * at rest as well. Whatever stands inside therefore keeps a few pixels of padding to the panel's
 * edge, or a focus outline at the edge would be cut off.
 */
export const disclosurePanel = [
  "overflow-hidden transition-[height,opacity] spring-settle",
  "data-starting-style:h-0 data-starting-style:opacity-0",
  "data-ending-style:h-0 data-ending-style:opacity-0 data-ending-style:spring-leave",
].join(" ");

/** The chevron of a disclosure: muted until the row is pointed at, and it turns on `seat`. */
export const disclosureChevron =
  "text-fg-muted transition-[rotate,color] spring-seat group-hover:text-fg group-data-disabled:text-on-disabled";
