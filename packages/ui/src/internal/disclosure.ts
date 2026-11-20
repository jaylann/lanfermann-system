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

/**
 * Added to a `disclosurePanel` whose one child is its content (`Accordion`, `Collapsible`): the
 * content comes down with the opening edge from `--motion-enter-offset` above, so the answer
 * unfolds instead of being uncovered. Closing only fades: exits do not travel. Not on a panel
 * whose entries something else measures while they move (a `Sidebar`'s travelling tint).
 */
export const disclosureUnfold = [
  "*:transition-[translate] *:spring-settle",
  "data-starting-style:*:-translate-y-(--motion-enter-offset)",
].join(" ");

/**
 * The chevron of a disclosure: muted until the row is pointed at, and it turns on `seat`. While
 * the row is pointed at it also leans `--motion-lean` the way it points; each part sets that way
 * as `--lean` (an x and a y), since a chevron that has turned points elsewhere. Without `--lean`
 * it stays in place (`Sidebar`, `Trace`).
 */
export const disclosureChevron =
  "text-fg-muted transition-[rotate,translate,color] spring-seat group-hover:text-fg group-hover:[translate:var(--lean)] group-data-disabled:text-on-disabled";
